/* global cockpit */
import { STATIC_SCHEMA, normalizeBoolean, parseRenderedMan, updateConfig, validateChanges, valuesFor } from "./parser.js";

const _ = cockpit.gettext;
const DEFAULT_PATH = "/etc/cockpit/cockpit.conf";
const $ = id => document.getElementById(id);
const state = { schema: STATIC_SCHEMA, content: null, file: null, path: DEFAULT_PATH, presence: {}, initial: {}, busy: false, edited: new Set() };
const errorText = ex => ex?.message || ex?.problem || String(ex);
const message = (template, ex) => template.replace("{error}", errorText(ex));
const inputId = item => `option-${item.section}-${item.key}`.replace(/[^A-Za-z0-9_-]/g, "-");

async function configPath() {
    let dirs = ["/etc"];
    try { const output = await cockpit.spawn(["printenv", "XDG_CONFIG_DIRS"], { err: "message" }); if (output.trim()) dirs.push(...output.trim().split(":").filter(Boolean)); } catch { /* /etc is the documented fallback */ }
    const candidates = dirs.map(dir => `${dir}/cockpit/cockpit.conf`);
    for (const path of candidates) {
        const file = cockpit.file(path, { superuser: "require", err: "message" });
        try {
            if (await file.read() !== null)
                return path;
        } catch { /* absent/unreadable candidates are skipped */ }
        finally { file.close(); }
    }
    return DEFAULT_PATH;
}

async function discoverSchema() {
    try {
        const output = await cockpit.spawn(["man", "-P", "cat", "cockpit.conf"], { environ: ["LC_ALL=C"], err: "message" });
        return [...STATIC_SCHEMA, ...parseRenderedMan(output)];
    } catch (ex) {
        console.warn("cockpit.conf(5) rendered discovery failed; using static schema", ex);
        status(_("Only the safe built-in option set is available; man-page discovery failed."), true);
        return STATIC_SCHEMA;
    }
}

function setBusy(busy) { state.busy = busy; document.querySelectorAll("button, input").forEach(control => { control.disabled = busy; }); }
function status(text, error = false) { $("global-status").textContent = text; $("global-status").classList.toggle("pf-m-danger", error); }

function render(schema, parsed) {
    const editable = $("editable-grid"), readonly = $("readonly-grid"); editable.replaceChildren(); readonly.replaceChildren();
    const groups = new Map();
    for (const item of schema) {
        const target = item.editable ? editable : readonly, group = `${item.editable}:${item.section}`;
        if (!groups.has(group)) { const card = document.createElement("section"); card.className = "pf-v6-c-card"; card.setAttribute("aria-labelledby", `${item.editable ? "editable" : "readonly"}-${item.section}`); const header = document.createElement("div"); header.className = "pf-v6-c-card__header"; const title = document.createElement("h2"); title.className = "pf-v6-c-card__title pf-v6-c-title pf-m-lg"; title.id = `${item.editable ? "editable" : "readonly"}-${item.section}`; title.textContent = `[${item.section}]`; header.append(title); const body = document.createElement("div"); body.className = "pf-v6-c-card__body"; card.append(header, body); target.append(card); groups.set(group, body); }
        const field = document.createElement("div"); field.className = "pf-v6-c-form__group"; const id = inputId(item), option = `${item.section}.${item.key}`;
        const label = document.createElement("label"); label.className = "pf-v6-c-form__label"; label.htmlFor = id; label.textContent = item.key; field.append(label);
        const help = document.createElement("p"); help.className = "pf-v6-c-form__helper-text"; help.id = `${id}-help`; help.textContent = _(item.help); field.append(help);
        if (item.editable) {
            const input = document.createElement("input"); input.className = "pf-v6-c-form-control"; input.id = id; input.dataset.option = option; input.setAttribute("aria-describedby", help.id); input.type = item.type === "boolean" ? "checkbox" : item.type === "integer" ? "number" : "text";
            if (item.type === "integer") { input.min = item.min; input.max = item.max; input.step = "1"; }
            if (item.type !== "boolean") { input.value = parsed.values[option] || ""; input.placeholder = item.type === "integer" ? _("Example: 15") : _("Example: https://example.com"); } else input.checked = normalizeBoolean(parsed.values[option]) === "true";
            input.addEventListener("input", () => state.edited.add(option)); input.addEventListener("change", () => state.edited.add(option)); field.append(input);
        } else { const value = document.createElement("code"); value.className = "readonly"; value.textContent = parsed.values[option] || _("not set"); field.append(value); }
        groups.get(group).append(field);
    }
    $("editable-state").textContent = schema.some(item => item.editable) ? "" : _("No safely editable options were found."); $("readonly-state").textContent = schema.some(item => !item.editable) ? "" : _("No read-only options were found.");
}

function formChanges() { const changes = {}; for (const input of document.querySelectorAll("[data-option]")) if (state.edited.has(input.dataset.option)) changes[input.dataset.option] = input.type === "checkbox" ? (input.checked ? "true" : "false") : input.value.trim(); return changes; }
function showValidation(errors) { let first = null; for (const input of document.querySelectorAll("[data-option]")) { const error = errors[input.dataset.option]; input.setAttribute("aria-invalid", error ? "true" : "false"); const errorId = `${input.id}-error`; document.getElementById(errorId)?.remove(); if (error) { const node = document.createElement("p"); node.id = errorId; node.className = "config-field-error"; node.textContent = _(error); input.after(node); input.setAttribute("aria-describedby", `${input.id}-help ${errorId}`); first ||= input; } else input.setAttribute("aria-describedby", `${input.id}-help`); } first?.focus(); return Boolean(first); }

async function load() {
    setBusy(true); state.edited.clear(); status(_("Loading cockpit.conf and its schema…"));
    try { state.schema = await discoverSchema(); state.path = await configPath(); state.file = cockpit.file(state.path, { superuser: "require", err: "message" }); state.content = await state.file.read(); const parsed = valuesFor(state.content || "", state.schema); state.initial = parsed.values; state.presence = parsed.presence; render(state.schema, parsed); $("path-status").textContent = state.path; status(state.content === null ? _("The active file does not exist yet; saving will create it.") : _("Configuration loaded.")); }
    catch (ex) { status(message(_("Could not load the configuration: {error}"), ex), true); $("editable-grid").replaceChildren(); $("readonly-grid").replaceChildren(); } finally { setBusy(false); }
}

async function save() {
    const changes = formChanges(), errors = validateChanges(changes, state.schema); if (showValidation(errors)) { status(_("Correct the highlighted fields before saving."), true); return; }
    setBusy(true); status(_("Saving configuration…"));
    try { await state.file.modify(old => updateConfig(old, changes, state.schema)); state.content = await state.file.read(); const parsed = valuesFor(state.content || "", state.schema); state.initial = parsed.values; state.presence = parsed.presence; state.edited.clear(); render(state.schema, parsed);
        let dbus; try { dbus = cockpit.dbus("org.freedesktop.systemd1", { superuser: "require", track: true }); await dbus.call("/org/freedesktop/systemd1", "org.freedesktop.systemd1.Manager", "ReloadUnit", ["cockpit.service", "replace"], { type: "ss" }); status(_("Configuration saved and cockpit.service reloaded.")); } catch (ex) { status(message(_("Configuration saved, but cockpit.service reload failed (ExecReload may be unsupported): {error}"), ex), true); } finally { dbus?.close(); }
    } catch (ex) { status(message(_("Configuration was not saved: {error}"), ex), true); } finally { setBusy(false); }
}

function setupTabs() { const tabs = [["tab-editable", "panel-editable"], ["tab-readonly", "panel-readonly"]]; function activate(id) { tabs.forEach(([tabId, panelId]) => { const selected = tabId === id; $(tabId).setAttribute("aria-selected", selected); $(tabId).tabIndex = selected ? 0 : -1; $(tabId).parentElement.classList.toggle("pf-m-current", selected); $(panelId).hidden = !selected; }); } tabs.forEach(([tabId], index) => { const tab = $(tabId); tab.addEventListener("click", () => activate(tabId)); tab.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(tabId); return; } let next = null; if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length; if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + tabs.length - 1) % tabs.length; if (event.key === "Home") next = 0; if (event.key === "End") next = tabs.length - 1; if (next !== null) { event.preventDefault(); $(tabs[next][0]).focus(); activate(tabs[next][0]); } }); }); }
function init() { document.title = _("Cockpit configuration"); $("title").textContent = _("Cockpit configuration"); $("description").textContent = _("Review and safely edit supported options. Administrator rights are required."); $("path-label").textContent = _("Active configuration file:"); $("tab-list").setAttribute("aria-label", _("Configuration sections")); $("tab-editable").textContent = _("Editable"); $("tab-readonly").textContent = _("Read-only"); $("save").textContent = _("Save and reload"); $("refresh").textContent = _("Refresh"); setupTabs(); $("save").addEventListener("click", save); $("refresh").addEventListener("click", load); load(); }
cockpit.transport.wait(() => { document.body.hidden = false; init(); });
