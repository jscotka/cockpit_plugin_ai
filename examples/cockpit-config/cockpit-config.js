/* global cockpit */
import { SCHEMA_METADATA, STATIC_SCHEMA, normalizeBoolean, parseRenderedMan, updateConfig, validateChanges, valuesFor } from "./parser.js";
import { assetRevisionMatches, canSave, missingRequiredIds, modifyAndRefresh } from "./save-flow.js";

const _ = cockpit.gettext;
const DEFAULT_PATH = "/etc/cockpit/cockpit.conf";
const ASSET_REVISION = "cockpit-config-v3";
const $ = id => document.getElementById(id);
const state = { schema: STATIC_SCHEMA, content: null, file: null, path: DEFAULT_PATH, presence: {}, initial: {}, busy: false, domReady: false, loaded: false, edited: new Set() };
const errorText = ex => ex?.message || ex?.problem || String(ex);
const message = (template, ex) => template.replace("{error}", errorText(ex));
const inputId = item => `option-${item.section}-${item.key}`.replace(/[^A-Za-z0-9_-]/g, "-");
const REQUIRED_IDS = ["global-status", "editable-grid", "readonly-grid", "editable-state", "readonly-state", "path-status", "title", "description", "security-warning", "path-label", "tab-list", "tab-editable", "tab-readonly", "panel-editable", "panel-readonly", "save", "refresh"];

function checkDomContract() {
    const missing = missingRequiredIds(new Set(REQUIRED_IDS.filter(id => $(id))), REQUIRED_IDS);
    if (!missing.length)
        return;
    const text = _("Cockpit configuration page is incomplete; missing required elements: {ids}").replace("{ids}", missing.join(", "));
    document.body.hidden = false;
    document.body.replaceChildren(document.createTextNode(text));
    console.error(text);
    throw new Error(text);
}

function checkAssetContract() {
    const htmlRevision = $("cockpit-config-root")?.dataset.cockpitConfigRevision;
    if (assetRevisionMatches(htmlRevision, ASSET_REVISION))
        return;
    const text = _("Cockpit configuration assets are out of sync; reload the page to use matching files.");
    document.body.hidden = false;
    document.body.replaceChildren(document.createTextNode(text));
    console.error(`${text} HTML=${htmlRevision || "missing"}, bundle=${ASSET_REVISION}`);
    throw new Error(text);
}

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
        const documentation = parseRenderedMan(output);
        return { schema: STATIC_SCHEMA, documentation };
    } catch (ex) {
        console.warn("cockpit.conf(5) rendered discovery failed; using static schema", ex);
        return { schema: STATIC_SCHEMA, documentation: { available: false, malformed: false, mismatch: true, error: errorText(ex) } };
    }
}

function documentationStatus(documentation) {
    if (!documentation.available)
        return _("Schema revision {revision} ({source}); cockpit.conf(5) unavailable: {error}").replace("{revision}", SCHEMA_METADATA.revision).replace("{source}", SCHEMA_METADATA.source).replace("{error}", documentation.error || _("unknown error"));
    if (documentation.malformed)
        return _("Schema revision {revision} ({source}); cockpit.conf(5) output was malformed and was not used to build controls.").replace("{revision}", SCHEMA_METADATA.revision).replace("{source}", SCHEMA_METADATA.source);
    if (documentation.mismatch)
        return _("Schema revision {revision} ({source}); cockpit.conf(5) differs from the checked-in manifest. The manifest remains authoritative.").replace("{revision}", SCHEMA_METADATA.revision).replace("{source}", SCHEMA_METADATA.source);
    return _("Schema revision {revision}; cockpit.conf(5) matches the checked-in manifest.").replace("{revision}", SCHEMA_METADATA.revision);
}

function setBusy(busy) { state.busy = busy; document.querySelectorAll("button, input").forEach(control => { control.disabled = busy || (control.id === "save" && !state.loaded); }); }
function status(text, error = false) {
    let node = $("global-status");
    if (!node) {
        node = document.createElement("p");
        node.id = "global-status-fallback";
        node.className = "config-status pf-m-danger";
        node.setAttribute("role", "alert");
        (document.querySelector(".cockpit-config-root") || document.body).prepend(node);
    }
    node.textContent = text;
    node.classList.toggle("pf-m-danger", error);
}

function render(schema, parsed) {
    const editable = $("editable-grid"), readonly = $("readonly-grid"); editable.replaceChildren(); readonly.replaceChildren();
    const groups = new Map();
    for (const item of schema) {
        const target = item.editable ? editable : readonly, group = `${item.editable}:${item.section}`;
        if (!groups.has(group)) { const card = document.createElement("section"); card.className = "pf-v6-c-card"; card.setAttribute("aria-labelledby", `${item.editable ? "editable" : "readonly"}-${item.section}`); const header = document.createElement("div"); header.className = "pf-v6-c-card__header"; const title = document.createElement("h2"); title.className = "pf-v6-c-card__title pf-v6-c-title pf-m-lg"; title.id = `${item.editable ? "editable" : "readonly"}-${item.section}`; title.textContent = `[${item.section}]`; header.append(title); const body = document.createElement("div"); body.className = "pf-v6-c-card__body"; card.append(header, body); target.append(card); groups.set(group, body); }
        const field = document.createElement("div"); field.className = "pf-v6-c-form__group"; const id = inputId(item), option = `${item.section}.${item.key}`;
        const help = document.createElement("p"); help.className = "pf-v6-c-form__helper-text"; help.id = `${id}-help`; help.textContent = _(item.help);
        if (item.editable) {
            const input = document.createElement("input"); input.className = item.type === "boolean" ? "pf-v6-c-check__input" : "pf-v6-c-form-control"; input.id = id; input.dataset.option = option; input.setAttribute("aria-describedby", help.id); input.type = item.type === "boolean" ? "checkbox" : item.type === "integer" ? "number" : "text"; if (item.validation?.maxLength) input.maxLength = item.validation.maxLength;
            if (item.type === "integer") { input.min = item.min; input.max = item.max; input.step = "1"; }
            if (item.type !== "boolean") { input.value = parsed.values[option] || ""; input.placeholder = item.placeholder || item.examples?.[0] || ""; } else input.checked = parsed.presence[option] ? normalizeBoolean(parsed.values[option]) === "true" : item.default === true;
            input.addEventListener("input", () => state.edited.add(option)); input.addEventListener("change", () => state.edited.add(option));
            if (item.type === "boolean") {
                const check = document.createElement("div"); check.className = "pf-v6-c-check";
                const label = document.createElement("label"); label.className = "pf-v6-c-check__label"; label.htmlFor = id; label.textContent = item.key;
                check.append(input, label); field.append(check, help);
            } else {
                const label = document.createElement("label"); label.className = "pf-v6-c-form__label"; label.htmlFor = id; label.textContent = item.key;
                field.append(label, help, input);
            }
        } else { const value = document.createElement("code"); value.className = "readonly"; value.textContent = parsed.values[option] || _("not set"); field.append(value); }
        groups.get(group).append(field);
    }
    $("editable-state").textContent = schema.some(item => item.editable) ? "" : _("No safely editable options were found."); $("readonly-state").textContent = schema.some(item => !item.editable) ? "" : _("No read-only options were found.");
}

function formChanges() { const changes = {}; for (const input of document.querySelectorAll("[data-option]")) if (state.edited.has(input.dataset.option)) changes[input.dataset.option] = input.type === "checkbox" ? (input.checked ? "true" : "false") : input.value; return changes; }
function showValidation(errors) { let first = null; for (const input of document.querySelectorAll("[data-option]")) { const error = errors[input.dataset.option]; input.setAttribute("aria-invalid", error ? "true" : "false"); const errorId = `${input.id}-error`; document.getElementById(errorId)?.remove(); if (error) { const node = document.createElement("p"); node.id = errorId; node.className = "config-field-error"; node.textContent = _(error); input.closest(".pf-v6-c-form__group").append(node); input.setAttribute("aria-describedby", `${input.id}-help ${errorId}`); first ||= input; } else input.setAttribute("aria-describedby", `${input.id}-help`); } first?.focus(); return Boolean(first); }

async function load() {
    setBusy(true); state.loaded = false; state.edited.clear(); state.file = null; status(_("Loading cockpit.conf and its schema…"));
    try { const discovered = await discoverSchema(); state.schema = discovered.schema; state.path = await configPath(); state.file = cockpit.file(state.path, { superuser: "require", err: "message" }); state.content = await state.file.read(); const parsed = valuesFor(state.content || "", state.schema); state.initial = parsed.values; state.presence = parsed.presence; render(state.schema, parsed); $("path-status").textContent = state.path; state.loaded = true; const loaded = state.content === null ? _("The active file does not exist yet; saving will create it.") : _("Configuration loaded."); status(`${loaded} ${documentationStatus(discovered.documentation)}`, discovered.documentation.mismatch); }
    catch (ex) { state.file = null; state.loaded = false; status(message(_("Could not load the configuration: {error}"), ex), true); $("editable-grid")?.replaceChildren(); $("readonly-grid")?.replaceChildren(); } finally { setBusy(false); }
}

async function save() {
    if (!canSave(state)) { status(_("Cannot save because the configuration was not loaded successfully."), true); return; }
    const changes = formChanges(), errors = validateChanges(changes, state.schema); if (showValidation(errors)) { status(_("Correct the highlighted fields before saving."), true); return; }
    setBusy(true); status(_("Saving configuration…"));
    const result = await modifyAndRefresh(state.file, old => updateConfig(old, changes, state.schema), async () => {
        state.content = await state.file.read();
        const parsed = valuesFor(state.content || "", state.schema);
        state.initial = parsed.values; state.presence = parsed.presence; state.edited.clear(); render(state.schema, parsed);
        let dbus;
        try { dbus = cockpit.dbus("org.freedesktop.systemd1", { superuser: "require", track: true }); await dbus.call("/org/freedesktop/systemd1", "org.freedesktop.systemd1.Manager", "ReloadUnit", ["cockpit.service", "replace"], { type: "ss" }); }
        finally { dbus?.close(); }
    });
    if (!result.saved) status(message(_("Configuration was not saved: {error}"), result.error), true);
    else if (result.refreshError) status(message(_("Configuration was saved, but the UI could not refresh: {error}"), result.refreshError), true);
    else status(_("Configuration saved and cockpit.service reloaded."));
    setBusy(false);
}

function setupTabs() { const tabs = [["tab-editable", "panel-editable"], ["tab-readonly", "panel-readonly"]]; function activate(id) { tabs.forEach(([tabId, panelId]) => { const selected = tabId === id; $(tabId).setAttribute("aria-selected", selected); $(tabId).tabIndex = selected ? 0 : -1; $(tabId).parentElement.classList.toggle("pf-m-current", selected); $(panelId).hidden = !selected; }); } tabs.forEach(([tabId], index) => { const tab = $(tabId); tab.addEventListener("click", () => activate(tabId)); tab.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(tabId); return; } let next = null; if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length; if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + tabs.length - 1) % tabs.length; if (event.key === "Home") next = 0; if (event.key === "End") next = tabs.length - 1; if (next !== null) { event.preventDefault(); $(tabs[next][0]).focus(); activate(tabs[next][0]); } }); }); }
function init() { checkDomContract(); checkAssetContract(); state.domReady = true; document.title = _("Cockpit configuration"); $("title").textContent = _("Cockpit configuration"); $("description").textContent = _("Review and safely edit supported options. Administrator rights are required."); $("security-warning").textContent = _("Security warning: changing authentication, origins, proxy headers, OAuth, or paths may lock you out or disrupt the current session. Changes are applied immediately when saved."); $("path-label").textContent = _("Active configuration file:"); $("tab-list").setAttribute("aria-label", _("Configuration sections")); $("tab-editable").textContent = _("Editable"); $("tab-readonly").textContent = _("Read-only"); $("save").textContent = _("Save and reload"); $("refresh").textContent = _("Refresh"); setupTabs(); $("save").addEventListener("click", save); $("refresh").addEventListener("click", load); load(); }
cockpit.transport.wait(() => { document.body.hidden = false; init(); });
