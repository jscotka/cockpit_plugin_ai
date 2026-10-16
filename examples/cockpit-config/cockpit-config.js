/* global cockpit */
import { SCHEMA_METADATA, STATIC_SCHEMA, parseRenderedMan, updateConfig, validateChanges, valuesFor } from "./parser.js";
import { assetRevisionMatches, canSave, missingRequiredIds, modifyAndRefresh } from "./save-flow.js";
import { DomCompatibilityError, renderConfiguration } from "./render.js";

const _ = cockpit.gettext;
const DEFAULT_PATH = "/etc/cockpit/cockpit.conf";
const ASSET_REVISION = "cockpit-config-v5";
const $ = id => document.getElementById(id);
const state = { schema: STATIC_SCHEMA, content: null, file: null, path: DEFAULT_PATH, presence: {}, initial: {}, busy: false, domReady: false, loaded: false, edited: new Set() };
const errorText = ex => ex?.message || ex?.problem || String(ex);
const message = (template, ex) => template.replace("{error}", errorText(ex));
const REQUIRED_IDS = ["global-status", "editable-grid", "options-title", "path-status", "title", "description", "security-warning", "path-label", "save", "refresh"];

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

/* rendering is isolated so a deployed HTML variant without optional state labels remains usable */
function render(schema, parsed) {
    return renderConfiguration(schema, parsed, { document, translate: _, edited: state.edited });
}

function formChanges() { const changes = {}; for (const input of document.querySelectorAll("[data-option]")) if (state.edited.has(input.dataset.option)) changes[input.dataset.option] = input.type === "checkbox" ? (input.checked ? "true" : "false") : input.value; return changes; }
function showValidation(errors) { let first = null; for (const input of document.querySelectorAll("[data-option]")) { const error = errors[input.dataset.option]; input.setAttribute("aria-invalid", error ? "true" : "false"); const errorId = `${input.id}-error`; document.getElementById(errorId)?.remove(); const describedBy = [input.dataset.securityHelp, `${input.id}-help`].filter(Boolean).join(" "); if (error) { const node = document.createElement("p"); node.id = errorId; node.className = "config-field-error"; node.textContent = _(error); input.closest(".pf-v6-c-form__group").append(node); input.setAttribute("aria-describedby", `${describedBy} ${errorId}`); first ||= input; } else input.setAttribute("aria-describedby", describedBy); } first?.focus(); return Boolean(first); }

async function load() {
    setBusy(true); state.loaded = false; state.edited.clear(); state.file = null; status(_("Loading cockpit.conf and its schema…"));
    try { const discovered = await discoverSchema(); state.schema = discovered.schema; state.path = await configPath(); state.file = cockpit.file(state.path, { superuser: "require", err: "message" }); state.content = await state.file.read(); const parsed = valuesFor(state.content || "", state.schema); state.initial = parsed.values; state.presence = parsed.presence; render(state.schema, parsed); $("path-status").textContent = state.path; state.loaded = true; const loaded = state.content === null ? _("The active file does not exist yet; saving will create it.") : _("Configuration loaded."); status(`${loaded} ${documentationStatus(discovered.documentation)}`, discovered.documentation.mismatch); }
    catch (ex) { state.file = null; state.loaded = false; const prefix = ex instanceof DomCompatibilityError ? _("Could not render the configuration: {error}") : _("Could not load the configuration: {error}"); status(message(prefix, ex), true); } finally { setBusy(false); }
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

function init() { checkDomContract(); checkAssetContract(); state.domReady = true; document.title = _("Cockpit configuration"); $("title").textContent = _("Cockpit configuration"); $("description").textContent = _("Review and safely edit supported options. Administrator rights are required."); $("security-warning").textContent = _("Security warning: changing authentication, origins, proxy headers, OAuth, or paths may lock you out or disrupt the current session. Changes are applied immediately when saved."); $("path-label").textContent = _("Active configuration file:"); $("options-title").textContent = _("Configuration options"); $("save").textContent = _("Save and reload"); $("refresh").textContent = _("Refresh"); $("save").addEventListener("click", save); $("refresh").addEventListener("click", load); load(); }
cockpit.transport.wait(() => { document.body.hidden = false; init(); });
