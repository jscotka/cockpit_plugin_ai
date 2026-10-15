/* global cockpit */

(function () {
    "use strict";

    const _ = cockpit.gettext;
    const CONFIG_PATH = "/etc/valkey/valkey.conf";
    const UNIT = "valkey.service";
    const PACKAGE = "valkey";
    const MAX_SAMPLES = 30;
    const MAX_KEY_BYTES = 256;
    const MAX_VALUE_BYTES = 1024 * 1024;
    const PK = { FILTER_INSTALLED: 1 << 2, FILTER_NOT_INSTALLED: 1 << 3, FILTER_NEWEST: 1 << 16, FILTER_ARCH: 1 << 18, FILTER_NOT_SOURCE: 1 << 21, SUCCESS: 1 };
    const PK_IFACE = "org.freedesktop.PackageKit.Transaction";
    const DBUS_PROPERTIES = "org.freedesktop.DBus.Properties";
    const SD_MANAGER = "org.freedesktop.systemd1.Manager";
    const SD_UNIT = "org.freedesktop.systemd1.Unit";
    const SD_PATH = "/org/freedesktop/systemd1";
    const $ = id => document.getElementById(id);
    const controls = Array.from(document.querySelectorAll("input, textarea, select, button"));
    const state = { dbus: [], files: [], spawns: new Set(), timers: new Set(), installed: false, busy: false, destroyed: false, config: null, configDirty: false, messages: [], samples: { ops: [], clients: [], memory: [] } };

    function text(id, value) { $(id).textContent = value; }
    function errorText(ex) { return ex?.message || ex?.problem || String(ex); }
    function pageError() { text("page-status", _("A Valkey operation failed; see the relevant section for details.")); }
    function setBusy(busy) { state.busy = busy; controls.forEach(control => { control.disabled = busy; }); }
    function setInstalledControls(enabled) { ["start", "stop", "restart", "refresh", "refresh-configuration", "save", "read-key", "write-key", "delete-key", "store-message", "refresh-messages"].forEach(id => { $(id).disabled = !enabled; }); }
    function timer(fn, delay) { const id = window.setTimeout(() => { state.timers.delete(id); if (!state.destroyed) fn(); }, delay); state.timers.add(id); return id; }
    function interval(fn, delay) { const id = window.setInterval(() => { if (!state.destroyed) fn(); }, delay); state.timers.add(id); return id; }
    function spawn(argv, options) { const process = cockpit.spawn(argv, options); state.spawns.add(process); process.always(() => state.spawns.delete(process)); return process; }
    function spawnWithTimeout(argv, options, delay = 10000) { const process = spawn(argv, options); return new Promise((resolve, reject) => { let settled = false; const watchdog = timer(() => { if (settled) return; settled = true; process.close(); reject(new Error(_("Valkey request timed out."))); }, delay); const finish = (callback, value) => { if (settled) return; settled = true; window.clearTimeout(watchdog); state.timers.delete(watchdog); callback(value); }; process.then(output => finish(resolve, output), ex => finish(reject, ex)); }); }
    function cliArgs(...args) { const config = state.config, host = config && ["0.0.0.0", "::"].includes(config.bind) ? "127.0.0.1" : config?.bind, command = ["valkey-cli", "--raw", "-n", "0"]; if (host && config.port) command.push("-h", host, "-p", config.port); return command.concat(args); }
    function dbus(name, options) { const client = cockpit.dbus(name, options); state.dbus.push(client); return client; }
    function message(template, ex) { return template.replace("{error}", errorText(ex)); }
    function setupTabs() {
        const tabList = $("tab-list"), tabs = [
            ["tab-overview", "panel-overview", _("Overview")],
            ["tab-configuration", "panel-configuration", _("Configuration")],
            ["tab-messages", "panel-messages", _("Message debugging")],
        ];
        tabList.setAttribute("aria-label", _("Valkey sections"));
        tabs.forEach(([id, panel, label], index) => {
            const tab = $(id);
            tab.textContent = label; tab.setAttribute("aria-controls", panel); tab.setAttribute("aria-selected", index === 0 ? "true" : "false"); tab.tabIndex = index === 0 ? 0 : -1;
            tab.addEventListener("click", () => activateTab(id));
            tab.addEventListener("keydown", event => {
                const current = tabs.findIndex(([tabId]) => tabId === id);
                let next;
                if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
                else if (event.key === "ArrowLeft") next = (current + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activateTab(id); return; }
                else return;
                event.preventDefault(); tabs[next] && $(tabs[next][0]).focus();
            });
        });
        function activateTab(id) {
            tabs.forEach(([tabId, panel]) => { const selected = tabId === id; $(tabId).setAttribute("aria-selected", selected ? "true" : "false"); $(tabId).tabIndex = selected ? 0 : -1; $(panel).hidden = !selected; });
            tabList.parentElement.dataset.activeTab = id;
        }
    }

    function packageTransaction(method, args, handlers) {
        const client = dbus("org.freedesktop.PackageKit", { superuser: "require", track: true });
        return new Promise((resolve, reject) => {
            let path, subscriptions = [], timeout, settled = false;
            const finish = (fn, value) => { if (settled) return; settled = true; subscriptions.forEach(subscription => subscription.remove()); if (timeout) { window.clearTimeout(timeout); state.timers.delete(timeout); } fn(value); };
            client.call("/org/freedesktop/PackageKit", "org.freedesktop.PackageKit", "CreateTransaction", []).then(([transaction]) => {
                path = transaction;
                for (const [member, callback] of Object.entries(handlers || {})) subscriptions.push(client.subscribe({ interface: PK_IFACE, path, member }, (_p, _i, _s, args) => callback(...args)));
                subscriptions.push(client.subscribe({ interface: PK_IFACE, path, member: "Finished" }, (_p, _i, _s, args) => args[0] === PK.SUCCESS ? finish(resolve) : finish(reject, new Error(_("PackageKit could not complete the operation.")))));
                timeout = timer(() => finish(reject, new Error(_("PackageKit operation timed out."))), 30000);
                return client.call(path, PK_IFACE, method, args);
            }).catch(ex => finish(reject, ex));
        });
    }
    async function resolvePackage(filter) { const packages = []; await packageTransaction("Resolve", [filter, [PACKAGE]], { Package: (_info, id) => packages.push(id) }); return packages; }
    async function detectPackage() {
        setBusy(true); text("installation-status", _("Checking whether the Valkey package is installed…"));
        try {
            state.installed = (await resolvePackage(PK.FILTER_INSTALLED | PK.FILTER_NEWEST | PK.FILTER_ARCH | PK.FILTER_NOT_SOURCE)).length > 0;
            if (state.installed) { text("installation-status", _("Valkey is installed.")); $("install").hidden = true; setInstalledControls(true); await refreshPage(); }
            else { text("installation-status", _("Valkey is not installed. Install the valkey package to manage this service.")); $("install").hidden = false; setInstalledControls(false); }
        } catch (ex) { text("installation-status", message(_("Could not check package status: {error}"), ex)); $("install").hidden = false; setInstalledControls(false); }
        finally { setBusy(false); if (!state.installed) setInstalledControls(false); }
    }
    async function installPackage() {
        if (!window.confirm(_("Install the valkey package with administrator privileges?"))) return;
        setBusy(true); text("installation-status", _("Installing Valkey…"));
        try { const available = await resolvePackage(PK.FILTER_NOT_INSTALLED | PK.FILTER_NEWEST | PK.FILTER_ARCH | PK.FILTER_NOT_SOURCE); if (!available.length) throw new Error(_("The valkey package is not available from the configured repositories.")); await packageTransaction("InstallPackages", [0, [available[0]]]); state.installed = true; $("install").hidden = true; setInstalledControls(true); text("installation-status", _("Valkey was installed.")); await refreshPage(); }
        catch (ex) { text("installation-status", message(_("Valkey installation failed: {error}"), ex)); }
        finally { setBusy(false); }
    }

    async function serviceObject() {
        if (state.serviceClient && state.servicePath) return { client: state.serviceClient, path: state.servicePath };
        const client = dbus("org.freedesktop.systemd1", { superuser: "require", track: true });
        const [path] = await client.call(SD_PATH, SD_MANAGER, "LoadUnit", [UNIT], { type: "s" });
        state.serviceClient = client; state.servicePath = path;
        state.serviceSubscription = client.subscribe({ path, interface: DBUS_PROPERTIES, member: "PropertiesChanged" }, () => timer(refreshService, 250));
        return { client, path };
    }
    async function refreshService() {
        if (!state.installed || state.destroyed) return;
        text("service-status", _("Loading service status…"));
        try { const { client, path } = await serviceObject(); const [properties] = await client.call(path, DBUS_PROPERTIES, "GetAll", [SD_UNIT], { type: "s" }); text("service-status", _("Service status: {active} ({sub}).").replace("{active}", properties.ActiveState?.v || _("unknown")).replace("{sub}", properties.SubState?.v || _("unknown"))); }
        catch (ex) { state.serviceClient = null; state.servicePath = null; state.serviceSubscription?.remove(); state.serviceSubscription = null; text("service-status", message(_("Valkey service is unavailable: {error}"), ex)); pageError(); }
    }
    async function serviceAction(action) {
        const confirmation = { Stop: _("Stop the Valkey service?"), Restart: _("Restart the Valkey service?") }[action]; if (confirmation && !window.confirm(confirmation)) return;
        setBusy(true); text("service-status", _("Applying service action…"));
        try { const { client } = await serviceObject(); await client.call(SD_PATH, SD_MANAGER, `${action}Unit`, [UNIT, "replace"], { type: "ss" }); text("service-status", _("Service action completed; refreshing status…")); timer(refreshPage, 600); }
        catch (ex) { text("service-status", message(_("Service action failed: {error}"), ex)); } finally { setBusy(false); }
    }

    function parseConfig(content) {
        const values = {};
        for (const key of ["port", "bind", "protected-mode", "maxmemory"]) { const lines = content.split(/\r?\n/).filter(line => new RegExp(`^\\s*${key}(?:\\s|$)`, "i").test(line)); if (lines.length > 1) throw new Error(message(_("The Valkey configuration has duplicate {error} directives; it was not changed."), key)); values[key] = lines.length ? lines[0].replace(new RegExp(`^\\s*${key}\\s+`, "i"), "").trim() : ({ port: "6379", bind: "127.0.0.1", "protected-mode": "yes", maxmemory: "0" }[key]); }
        return values;
    }
    function formValues() { return { port: $("port").value.trim(), bind: $("bind").value.trim(), "protected-mode": $("protected-mode").value, maxmemory: $("maxmemory").value.trim() }; }
    function setConfig(values) { ["port", "bind", "protected-mode", "maxmemory"].forEach(key => { $(key).value = values[key]; }); state.config = values; state.configDirty = false; }
    async function loadConfig() {
        if (state.configDirty) { text("configuration-status", _("Configuration has unsaved edits; refresh did not replace them.")); return; }
        text("configuration-status", _("Loading current configuration…"));
        const file = cockpit.file(CONFIG_PATH, { superuser: "require", err: "message" }); state.files.push(file);
        try { setConfig(parseConfig(await file.read())); text("configuration-status", _("Current values loaded from /etc/valkey/valkey.conf.")); }
        catch (ex) { text("configuration-status", message(_("Could not read Valkey configuration: {error}"), ex)); pageError(); }
    }
    function validBind(value) { if (["localhost", "::", "0.0.0.0"].includes(value)) return true; if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return value.split(".").every(part => Number(part) <= 255); if (/^[0-9a-f:]+$/i.test(value) && value.includes(":")) return true; return /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(value); }
    function validMaxmemory(value) { if (!/^\d+(?:b|kb|mb|gb|tb)?$/i.test(value)) return false; try { const match = value.match(/^(\d+)(b|kb|mb|gb|tb)?$/i); const multiplier = { b: 1n, kb: 1024n, mb: 1024n ** 2n, gb: 1024n ** 3n, tb: 1024n ** 4n }[match[2]?.toLowerCase() || "b"]; return BigInt(match[1]) * multiplier <= 9223372036854775807n; } catch (_) { return false; } }
    function validate(values) { const errors = {}; if (!/^\d+$/.test(values.port) || Number(values.port) < 1 || Number(values.port) > 65535) errors.port = _("Port must be a number from 1 to 65535."); if (!validBind(values.bind)) errors.bind = _("Enter a valid IPv4 address, IPv6 address, hostname, localhost, or wildcard address."); if (!["yes", "no"].includes(values["protected-mode"])) errors["protected-mode"] = _("Choose yes or no."); if (!validMaxmemory(values.maxmemory)) errors.maxmemory = _("Maxmemory must be a non-negative number with an optional B, KB, MB, GB, or TB suffix."); ["port", "bind", "protected-mode", "maxmemory"].forEach(key => { text(`${key}-error`, errors[key] || ""); $(key).setAttribute("aria-invalid", errors[key] ? "true" : "false"); }); return errors; }
    function updateConfig(content, values) { const lines = content.split(/\r?\n/), managed = ["port", "bind", "protected-mode", "maxmemory"], found = new Set(); managed.forEach(key => { if (lines.filter(line => new RegExp(`^\\s*${key}(?:\\s|$)`, "i").test(line)).length > 1) throw new Error(_("The Valkey configuration has duplicate managed directives; it was not changed.")); }); const output = lines.map(line => { const match = line.match(/^([ \t]*)(port|bind|protected-mode|maxmemory)(?=\s|$)/i); if (!match) return line; found.add(match[2].toLowerCase()); return `${match[1]}${match[2].toLowerCase()} ${values[match[2].toLowerCase()]}`; }); managed.forEach(key => { if (!found.has(key)) output.push(`${key} ${values[key]}`); }); return output.join("\n"); }
    async function saveConfig(event) { event.preventDefault(); const values = formValues(), errors = validate(values), first = ["port", "bind", "protected-mode", "maxmemory"].find(key => errors[key]); if (first) { $(first).focus(); return; } if (!window.confirm(_("Save these Valkey settings? Valkey must be restarted for the changes to take effect."))) return; setBusy(true); text("configuration-status", _("Saving Valkey configuration…")); const file = state.files[state.files.length - 1] || cockpit.file(CONFIG_PATH, { superuser: "require", err: "message" }); try { await file.modify(content => updateConfig(content, values)); setConfig(values); text("configuration-status", _("Configuration saved. Restart Valkey to apply the changes.")); } catch (ex) { text("configuration-status", message(_("Could not save Valkey configuration: {error}"), ex)); } finally { setBusy(false); } }

    function parseInfo(output) { const result = {}; output.split(/\r?\n/).forEach(line => { const separator = line.indexOf(":"); if (separator > 0) result[line.slice(0, separator)] = line.slice(separator + 1).trim(); }); return result; }
    function formatBytes(value) { const number = Number(value); if (!Number.isFinite(number)) return _("unknown"); if (number < 1024) return `${number} B`; return `${(number / 1048576).toFixed(2)} MiB`; }
    async function collectMetrics() {
        text("internal-status", _("Loading internal Valkey status…")); text("metrics-status", _("Loading Valkey metrics…"));
        try { const config = state.config, host = config && ["0.0.0.0", "::"].includes(config.bind) ? "127.0.0.1" : config?.bind, infoArgs = ["valkey-cli", "--raw", "-n", "0"]; if (host && config.port) infoArgs.push("-h", host, "-p", config.port); infoArgs.push("INFO"); const values = parseInfo(await spawnWithTimeout(infoArgs, { err: "message" })); const numeric = ["used_memory", "uptime_in_seconds", "connected_clients"].every(key => typeof values[key] === "string" && values[key].trim() !== "" && Number.isFinite(Number(values[key]))); const dbValues = parseInfo((values.db0 || "").replace(/,/g, "\n")); const keys = values.db0 === undefined ? 0 : Number(dbValues.keys); if (!numeric || (values.db0 !== undefined && (typeof dbValues.keys !== "string" || dbValues.keys.trim() === "" || !Number.isFinite(keys)))) throw new Error(_("Valkey returned incomplete metrics.")); const current = { memory: Number(values.used_memory), clients: Number(values.connected_clients), ops: Number(values.instantaneous_ops_per_sec || 0), keys, uptime: Number(values.uptime_in_seconds), peak: Number(values.used_memory_peak || 0), fragmentation: Number(values.mem_fragmentation_ratio || 0) }; state.current = current; ["ops", "clients", "memory"].forEach(key => { state.samples[key].push(current[key]); if (state.samples[key].length > MAX_SAMPLES) state.samples[key].shift(); }); renderStatus(current); renderMetrics(current); text("internal-status", _("Valkey is reachable.")); text("metrics-status", _("Metrics update every five seconds.")); }
        catch (ex) { text("internal-status", message(_("Valkey is not reachable: {error}"), ex)); text("metrics-status", message(_("Could not read Valkey metrics: {error}"), ex)); pageError(); $("status-values").replaceChildren(); $("metrics").replaceChildren(); }
    }
    function renderStatus(values) { const labels = { memory: _("Used memory"), keys: _("Stored keys in database 0"), uptime: _("Uptime"), clients: _("Connected clients"), peak: _("Peak memory"), fragmentation: _("Memory fragmentation ratio") }; const formatted = { memory: formatBytes(values.memory), keys: String(values.keys), uptime: `${values.uptime} s`, clients: String(values.clients), peak: values.peak ? formatBytes(values.peak) : _("not reported"), fragmentation: values.fragmentation ? String(values.fragmentation) : _("not reported") }; const dl = $("status-values"); dl.replaceChildren(); Object.keys(labels).forEach(key => { const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = labels[key]; dd.textContent = formatted[key]; dl.append(dt, dd); }); }
    function renderMetrics(values) { const labels = { ops: _("Instantaneous operations per second"), clients: _("Connected clients"), memory: _("Used memory") }, format = { ops: value => String(value), clients: value => String(value), memory: formatBytes }; const container = $("metrics"); container.replaceChildren(); Object.keys(labels).forEach(key => { const article = document.createElement("article"), heading = document.createElement("h3"), value = document.createElement("div"), svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"), polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline"); article.className = "metric"; heading.textContent = labels[key]; value.className = "metric-value"; value.textContent = format[key](values[key]); svg.classList.add("sparkline"); svg.setAttribute("viewBox", "0 0 100 40"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", _("Recent values for {metric}").replace("{metric}", labels[key])); polyline.setAttribute("points", state.samples[key].map((sample, index) => `${(index / Math.max(state.samples[key].length - 1, 1)) * 100},${38 - (sample / Math.max(...state.samples[key], 1)) * 34}`).join(" ")); svg.append(polyline); article.append(heading, value, svg); container.append(article); }); }

    function bytes(value) { return new TextEncoder().encode(value).length; }
    function validateKeyForm(requireValue) { const key = $("key").value, value = $("key-value").value, errors = {}; if (!key) errors.key = _("Key cannot be empty."); else if (key.includes("\0")) errors.key = _("Key cannot contain a NUL character."); else if (bytes(key) > MAX_KEY_BYTES) errors.key = _("Key must be at most 256 bytes."); if (requireValue && (value.includes("\0") || bytes(value) > MAX_VALUE_BYTES)) errors.value = value.includes("\0") ? _("Value cannot contain a NUL character.") : _("Value must be at most 1 MiB."); text("key-error", errors.key || ""); text("key-value-error", errors.value || ""); $("key").setAttribute("aria-invalid", errors.key ? "true" : "false"); $("key-value").setAttribute("aria-invalid", errors.value ? "true" : "false"); const first = errors.key ? $("key") : errors.value ? $("key-value") : null; if (first) first.focus(); return !errors.key && !errors.value; }
    async function keyRead() { if (!validateKeyForm(false)) return; const key = $("key").value; setBusy(true); text("key-status", _("Reading key…")); try { const output = await spawnWithTimeout(cliArgs("GET", key), { superuser: "require", err: "message" }); const value = output.replace(/\r?\n$/, ""); if (value === "") { const exists = await spawnWithTimeout(cliArgs("EXISTS", key), { superuser: "require", err: "message" }); text("key-status", String(exists).trim() === "1" ? _("Key exists and contains an empty value.") : _("Key does not exist.")); $("key-value").value = ""; } else { $("key-value").value = value; text("key-status", _("Key value loaded.")); } } catch (ex) { text("key-status", message(_("Could not read key: {error}"), ex)); pageError(); } finally { setBusy(false); } }
    async function keyWrite() { if (!validateKeyForm(true)) return; if (!window.confirm(_("Write this value to database 0?"))) return; setBusy(true); text("key-status", _("Writing key…")); try { await spawnWithTimeout(cliArgs("SET", $("key").value, $("key-value").value), { superuser: "require", err: "message" }); const stored = await spawnWithTimeout(cliArgs("GET", $("key").value), { superuser: "require", err: "message" }); if (stored.replace(/\r?\n$/, "") !== $("key-value").value) throw new Error(_("Valkey did not return the value that was written.")); text("key-status", _("Key written and verified.")); await collectMetrics(); } catch (ex) { text("key-status", message(_("Could not write key: {error}"), ex)); } finally { setBusy(false); } }
    async function keyDelete() { if (!validateKeyForm(false)) return; if (!window.confirm(_("Delete this key from database 0?"))) return; setBusy(true); text("key-status", _("Deleting key…")); try { const result = await spawnWithTimeout(cliArgs("DEL", $("key").value), { superuser: "require", err: "message" }); text("key-status", String(result).trim() === "1" ? _("Key deleted.") : _("Key was not found; nothing was deleted.")); await collectMetrics(); } catch (ex) { text("key-status", message(_("Could not delete key: {error}"), ex)); } finally { setBusy(false); } }

    function wrongMessageType(ex) { return /WRONGTYPE/i.test(errorText(ex)); }
    async function loadMessages() { text("messages-status", _("Loading the last 10 messages…")); try { const output = await spawnWithTimeout(cliArgs("LRANGE", "messages", "-10", "-1"), { superuser: "require", err: "message" }); state.messages = output === "" ? [] : output.split(/\r?\n/).filter((entry, index, entries) => entry !== "" || index < entries.length - 1); renderMessages(); text("messages-status", state.messages.length ? _("Showing the last 10 entries from the messages list.") : _("The messages list is empty.")); } catch (ex) { state.messages = []; $("messages-list").replaceChildren(); text("messages-status", wrongMessageType(ex) ? _("The messages key is not a list. Change or delete its type before storing messages.") : message(_("Could not read the messages list: {error}"), ex)); pageError(); } }
    function renderMessages() { const filter = $("messages-filter").value.toLocaleLowerCase(), list = $("messages-list"); list.replaceChildren(); const visible = state.messages.filter(entry => entry.toLocaleLowerCase().includes(filter)); visible.forEach(entry => { const item = document.createElement("li"); item.textContent = entry; list.append(item); }); if (state.messages.length && !visible.length) text("messages-status", _("No messages match the filter.")); }
    function validateMessage() { const value = $("message").value, errors = {}; if (!value.trim()) errors.message = _("Message cannot be empty."); else if (value.includes("\0")) errors.message = _("Message cannot contain a NUL character."); else if (bytes(value) > MAX_VALUE_BYTES) errors.message = _("Message must be at most 1 MiB."); text("message-error", errors.message || ""); $("message").setAttribute("aria-invalid", errors.message ? "true" : "false"); if (errors.message) $("message").focus(); return !errors.message; }
    async function storeMessage(event) { event.preventDefault(); if (!validateMessage()) return; setBusy(true); text("message-status", _("Storing message…")); try { await spawnWithTimeout(cliArgs("LPUSH", "messages", $("message").value), { superuser: "require", err: "message" }); $("message").value = ""; text("message-status", _("Message stored; refreshing the messages list.")); await Promise.all([loadMessages(), collectMetrics()]); } catch (ex) { text("message-status", wrongMessageType(ex) ? _("The messages key is not a list. The message was not stored; change or delete its type first.") : message(_("Could not store the message: {error}"), ex)); } finally { setBusy(false); } }
    async function refreshPage() { if (!state.installed) return; text("page-status", _("Refreshing Valkey page…")); await Promise.all([refreshService(), loadConfig(), collectMetrics(), loadMessages()]); text("page-status", _("Valkey page refreshed.")); }

    function initialize() {
        document.title = _("Valkey");
        const labels = { "page-title": _("Valkey management"), "page-description": _("Valkey is an in-memory key-value database. This page manages the Fedora Valkey service, its configuration, database 0 keys, and the local messages list."), "installation-title": _("Installation"), install: _("Install Valkey"), "service-title": _("Service"), start: _("Start"), stop: _("Stop"), restart: _("Restart"), refresh: _("Refresh all"), "refresh-configuration": _("Refresh configuration"), "configuration-title": _("Current configuration"), "configuration-help": _("Values are loaded from /etc/valkey/valkey.conf. Refresh leaves unsaved configuration edits intact; save does not restart Valkey."), "port-label": _("Port"), "bind-label": _("Bind address"), "protected-mode-label": _("Protected mode"), "protected-yes": _("Yes"), "protected-no": _("No"), "maxmemory-label": _("Maximum memory"), save: _("Save configuration"), "internal-status-title": _("Internal Valkey status"), "key-title": _("Database 0 key operations"), "key-help": _("Read, write, or delete one key in database 0. Keys are limited to 256 bytes and values to 1 MiB; JSON is treated as plain text."), "key-label": _("Key"), "key-value-label": _("Value"), "read-key": _("Read"), "write-key": _("Write"), "delete-key": _("Delete"), "metrics-title": _("Live metrics"), "messages-title": _("Messages list"), "messages-help": _("The local Valkey database 0 list key named messages is the source. This page displays its last 10 entries."), "message-label": _("Message"), "store-message": _("Store message"), "messages-filter-label": _("Substring filter"), "refresh-messages": _("Refresh messages") }; Object.entries(labels).forEach(([id, value]) => text(id, value));
        setupTabs();
        $("install").addEventListener("click", installPackage); $("start").addEventListener("click", () => serviceAction("Start")); $("stop").addEventListener("click", () => serviceAction("Stop")); $("restart").addEventListener("click", () => serviceAction("Restart")); $("refresh").addEventListener("click", refreshPage); $("refresh-configuration").addEventListener("click", loadConfig); $("configuration-form").addEventListener("submit", saveConfig); ["port", "bind", "protected-mode", "maxmemory"].forEach(id => $(id).addEventListener("input", () => { state.configDirty = true; })); $("read-key").addEventListener("click", keyRead); $("write-key").addEventListener("click", keyWrite); $("delete-key").addEventListener("click", keyDelete); $("message-form").addEventListener("submit", storeMessage); $("refresh-messages").addEventListener("click", loadMessages); $("messages-filter").addEventListener("input", renderMessages); interval(collectMetrics, 5000); detectPackage();
    }
    function teardown() { state.destroyed = true; state.timers.forEach(id => { window.clearTimeout(id); window.clearInterval(id); }); state.serviceSubscription?.remove(); state.spawns.forEach(process => process.close?.()); state.files.forEach(file => file.close?.()); state.dbus.forEach(client => client.close?.()); }
    window.addEventListener("unload", teardown); cockpit.transport.wait(() => { document.body.hidden = false; initialize(); });
}());
