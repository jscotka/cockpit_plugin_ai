/* global cockpit */

(function () {
    "use strict";

    const _ = cockpit.gettext;
    const CONFIG_PATH = "/etc/valkey/valkey.conf";
    const UNIT = "valkey.service";
    const PACKAGE = "valkey";
    const MAX_SAMPLES = 30;
    const PK = {
        FILTER_INSTALLED: 1 << 2,
        FILTER_NOT_INSTALLED: 1 << 3,
        FILTER_NEWEST: 1 << 16,
        FILTER_ARCH: 1 << 18,
        FILTER_NOT_SOURCE: 1 << 21,
        SUCCESS: 1,
        INFO_INSTALLED: 2,
    };
    const PK_IFACE = "org.freedesktop.PackageKit.Transaction";
    const DBUS_PROPERTIES = "org.freedesktop.DBus.Properties";
    const SD_MANAGER = "org.freedesktop.systemd1.Manager";
    const SD_UNIT = "org.freedesktop.systemd1.Unit";
    const SD_PATH = "/org/freedesktop/systemd1";
    // This MVP intentionally targets Fedora 44 with package "valkey",
    // unit "valkey.service", executable "valkey-cli", and this configuration path.

    const $ = id => document.getElementById(id);
    const controls = Array.from(document.querySelectorAll("input, select, button"));
    const state = { dbus: [], files: [], spawns: new Set(), timers: new Set(), subscriptions: [], destroyed: false,
        installed: false, busy: false, config: null, samples: { ops: [], clients: [], memory: [] } };

    function text(id, value) { $(id).textContent = value; }
    function errorText(ex) { return ex?.message || ex?.problem || String(ex); }
    function setBusy(busy) { state.busy = busy; controls.forEach(control => { control.disabled = busy; }); }
    function setInstalledControls(enabled) {
        ["start", "stop", "restart", "refresh", "port", "bind", "protected-mode", "maxmemory", "save"].forEach(id => { $(id).disabled = !enabled; });
    }
    function timer(fn, delay) {
        const id = window.setTimeout(() => { state.timers.delete(id); if (!state.destroyed) fn(); }, delay);
        state.timers.add(id);
        return id;
    }
    function interval(fn, delay) {
        const id = window.setInterval(() => { if (!state.destroyed) fn(); }, delay);
        state.timers.add(id);
        return id;
    }
    function callSpawn(argv, options) {
        const process = cockpit.spawn(argv, options);
        state.spawns.add(process);
        process.always(() => state.spawns.delete(process));
        return process;
    }
    function dbus(name, options) {
        const client = cockpit.dbus(name, options);
        state.dbus.push(client);
        return client;
    }

    function packageTransaction(method, args, handlers) {
        const client = dbus("org.freedesktop.PackageKit", { superuser: "require", track: true });
        let transactionPath;
        let subscriptions = [];
        let timeout;
        return new Promise((resolve, reject) => {
            let settled = false;
            const cleanup = () => {
                subscriptions.forEach(subscription => subscription.remove());
                subscriptions = [];
                if (timeout !== undefined) {
                    window.clearTimeout(timeout);
                    state.timers.delete(timeout);
                }
            };
            const finish = (callback, value) => {
                if (settled) return;
                settled = true;
                cleanup();
                callback(value);
            };

            client.call("/org/freedesktop/PackageKit", "org.freedesktop.PackageKit", "CreateTransaction", [])
                    .then(([path]) => {
                        transactionPath = path;
                        for (const [member, callback] of Object.entries(handlers || {}))
                            subscriptions.push(client.subscribe({ interface: PK_IFACE, path, member }, (_path, _iface, _signal, signalArgs) => callback(...signalArgs)));
                        subscriptions.push(client.subscribe({ interface: PK_IFACE, path, member: "Finished" }, (_path, _iface, _signal, signalArgs) => {
                            if (signalArgs[0] === PK.SUCCESS)
                                finish(resolve);
                            else
                                finish(reject, new Error(_("PackageKit could not complete the operation.")));
                        }));
                        timeout = timer(() => finish(reject, new Error(_("PackageKit operation timed out."))), 30000);
                        return client.call(path, PK_IFACE, method, args);
                    })
                    .catch(ex => finish(reject, ex));
        });
    }

    async function resolvePackage(filter) {
        const packages = [];
        await packageTransaction("Resolve", [filter, [PACKAGE]], { Package: (_info, id) => packages.push(id) });
        return packages;
    }

    async function detectPackage() {
        setBusy(true);
        text("installation-status", _("Checking whether the Valkey package is installed…"));
        try {
            const installed = await resolvePackage(PK.FILTER_INSTALLED | PK.FILTER_NEWEST | PK.FILTER_ARCH | PK.FILTER_NOT_SOURCE);
            state.installed = installed.length > 0;
            if (state.installed) {
                text("installation-status", _("Valkey is installed."));
                $("install").hidden = true;
                setInstalledControls(true);
                await refreshService();
                loadConfig();
            } else {
                text("installation-status", _("Valkey is not installed. Install the valkey package to manage this service."));
                $("install").hidden = false;
                $("install").disabled = false;
                setInstalledControls(false);
            }
        } catch (ex) {
            text("installation-status", _("Could not check package status: {error}").replace("{error}", errorText(ex)));
            $("install").hidden = false;
            $("install").disabled = false;
            setInstalledControls(false);
        } finally { setBusy(false); if (!state.installed) setInstalledControls(false); }
    }

    async function installPackage() {
        if (!window.confirm(_("Install the valkey package with administrator privileges?"))) return;
        setBusy(true); text("installation-status", _("Installing Valkey…"));
        try {
            const available = await resolvePackage(PK.FILTER_NOT_INSTALLED | PK.FILTER_NEWEST | PK.FILTER_ARCH | PK.FILTER_NOT_SOURCE);
            if (!available.length) throw new Error(_("The valkey package is not available from the configured repositories."));
            await packageTransaction("InstallPackages", [0, [available[0]]], { });
            state.installed = true; $("install").hidden = true;
            setInstalledControls(true);
            text("installation-status", _("Valkey was installed."));
            await refreshService(); loadConfig();
        } catch (ex) { text("installation-status", _("Valkey installation failed: {error}").replace("{error}", errorText(ex))); }
        finally { setBusy(false); }
    }

    async function serviceObject() {
        if (state.serviceClient && state.servicePath) return { client: state.serviceClient, path: state.servicePath };
        const client = dbus("org.freedesktop.systemd1", { superuser: "require", track: true });
        const [path] = await client.call(SD_PATH, SD_MANAGER, "GetUnit", [UNIT], { type: "s" });
        state.serviceClient = client; state.servicePath = path;
        state.serviceSubscription = client.subscribe({ path, interface: DBUS_PROPERTIES, member: "PropertiesChanged" }, () => timer(refreshService, 250));
        return { client, path };
    }
    async function refreshService() {
        if (!state.installed || state.destroyed) return;
        text("service-status", _("Loading service status…"));
        try {
            const { client, path } = await serviceObject();
            const [properties] = await client.call(path, DBUS_PROPERTIES, "GetAll", [SD_UNIT], { type: "s" });
            const active = properties.ActiveState?.v || _("unknown");
            const sub = properties.SubState?.v || _("unknown");
            text("service-status", _("Service status: {active} ({sub}).").replace("{active}", active).replace("{sub}", sub));
            await collectMetrics();
        } catch (ex) {
            state.serviceClient = null; state.servicePath = null; state.serviceSubscription?.remove(); state.serviceSubscription = null;
            text("service-status", _("Valkey service is unavailable: {error}").replace("{error}", errorText(ex)));
            text("metrics-status", _("Metrics are unavailable until the Valkey service is running."));
        }
    }
    async function serviceAction(action) {
        const confirmation = { Stop: _("Stop the Valkey service?"), Restart: _("Restart the Valkey service?") }[action];
        if (confirmation && !window.confirm(confirmation)) return;
        setBusy(true); text("service-status", _("Applying service action…"));
        try {
            const { client } = await serviceObject();
            await client.call(SD_PATH, SD_MANAGER, `${action}Unit`, [UNIT, "replace"], { type: "ss" });
            text("service-status", _("Service action completed; refreshing status…"));
            timer(refreshService, 600);
        } catch (ex) { text("service-status", _("Service action failed: {error}").replace("{error}", errorText(ex))); }
        finally { setBusy(false); }
    }

    function parseConfig(content) {
        const values = {};
        for (const key of ["port", "bind", "protected-mode", "maxmemory"]) {
            const lines = content.split(/\r?\n/).filter(line => new RegExp(`^\\s*${key}(?:\\s|$)`, "i").test(line));
            if (lines.length > 1) throw new Error(_("The Valkey configuration has duplicate {key} directives; it was not changed.").replace("{key}", key));
            values[key] = lines.length ? lines[0].replace(new RegExp(`^\\s*${key}\\s+`, "i"), "").trim() : (key === "port" ? "6379" : key === "bind" ? "127.0.0.1" : key === "protected-mode" ? "yes" : "0");
        }
        return values;
    }
    function loadConfig() {
        const file = cockpit.file(CONFIG_PATH, { superuser: "require", err: "message" }); state.files.push(file);
        file.read().then(content => { state.config = parseConfig(content); $("port").value = state.config.port; $("bind").value = state.config.bind; $("protected-mode").value = state.config["protected-mode"]; $("maxmemory").value = state.config.maxmemory; })
                .catch(ex => text("configuration-status", _("Could not read Valkey configuration: {error}").replace("{error}", errorText(ex))));
    }
    function validBind(value) {
        if (value === "localhost" || value === "::" || value === "0.0.0.0") return true;
        if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return value.split(".").every(part => Number(part) <= 255);
        if (/^[0-9a-f:]+$/i.test(value) && value.includes(":")) return true;
        return /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(value);
    }
    function validMaxmemory(value) {
        if (!/^\d+(?:b|kb|mb|gb|tb)?$/i.test(value)) return false;
        try { const match = value.match(/^(\d+)(b|kb|mb|gb|tb)?$/i); const multiplier = { b: 1n, kb: 1024n, mb: 1024n ** 2n, gb: 1024n ** 3n, tb: 1024n ** 4n }[match[2]?.toLowerCase() || "b"]; return BigInt(match[1]) * multiplier <= 9223372036854775807n; } catch (_) { return false; }
    }
    function formValues() { return { port: $("port").value.trim(), bind: $("bind").value.trim(), "protected-mode": $("protected-mode").value, maxmemory: $("maxmemory").value.trim() }; }
    function validate(values) {
        const errors = {};
        if (!/^\d+$/.test(values.port) || Number(values.port) < 1 || Number(values.port) > 65535) errors.port = _("Port must be a number from 1 to 65535.");
        if (!validBind(values.bind)) errors.bind = _("Enter a valid IPv4 address, IPv6 address, hostname, localhost, or wildcard address.");
        if (!["yes", "no"].includes(values["protected-mode"])) errors["protected-mode"] = _("Choose yes or no.");
        if (!validMaxmemory(values.maxmemory)) errors.maxmemory = _("Maxmemory must be a non-negative number with an optional B, KB, MB, GB, or TB suffix.");
        ["port", "bind", "protected-mode", "maxmemory"].forEach(key => text(`${key}-error`, errors[key] || ""));
        return errors;
    }
    function updateConfig(content, values) {
        const lines = content.split(/\r?\n/); const managed = ["port", "bind", "protected-mode", "maxmemory"]; const found = new Set();
        managed.forEach(key => {
            const count = lines.filter(line => new RegExp(`^\\s*${key}(?:\\s|$)`, "i").test(line)).length;
            if (count > 1) throw new Error(_("The Valkey configuration has duplicate {key} directives; it was not changed.").replace("{key}", key));
        });
        const output = lines.map(line => {
            const match = line.match(/^([ \t]*)(port|bind|protected-mode|maxmemory)(?=\s|$)/i);
            if (!match) return line;
            found.add(match[2].toLowerCase()); return `${match[1]}${match[2].toLowerCase()} ${values[match[2].toLowerCase()]}`;
        });
        managed.forEach(key => { if (!found.has(key)) output.push(`${key} ${values[key]}`); });
        return output.join("\n");
    }
    async function saveConfig(event) {
        event.preventDefault(); const values = formValues(); const errors = validate(values); const first = ["port", "bind", "protected-mode", "maxmemory"].find(key => errors[key]);
        if (first) { $(first).focus(); return; }
        if (!window.confirm(_("Save these Valkey settings? Valkey must be restarted for the changes to take effect."))) return;
        setBusy(true); text("configuration-status", _("Saving Valkey configuration…"));
        const file = state.files[state.files.length - 1] || cockpit.file(CONFIG_PATH, { superuser: "require", err: "message" });
        try { await file.modify(content => updateConfig(content, values)); state.config = values; text("configuration-status", _("Configuration saved. Restart Valkey to apply the changes.")); }
        catch (ex) { text("configuration-status", _("Could not save Valkey configuration: {error}").replace("{error}", errorText(ex))); }
        finally { setBusy(false); }
    }

    function parseInfo(output) {
        const result = {}; output.split(/\r?\n/).forEach(line => { const separator = line.indexOf(":"); if (separator > 0) result[line.slice(0, separator)] = line.slice(separator + 1).trim(); });
        return { ops: Number(result.instantaneous_ops_per_sec), clients: Number(result.connected_clients), memory: Number(result.used_memory) };
    }
    function spawnWithTimeout(argv, options, delay) {
        const process = callSpawn(argv, options);
        return new Promise((resolve, reject) => {
            let settled = false;
            const watchdog = timer(() => {
                if (settled) return;
                settled = true;
                process.close();
                reject(new Error(_("Valkey metrics request timed out.")));
            }, delay);
            const finish = (callback, value) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(watchdog);
                state.timers.delete(watchdog);
                callback(value);
            };
            process.then(output => finish(resolve, output), ex => finish(reject, ex));
        });
    }
    async function collectMetrics() {
        if (state.metricRequest || !state.installed || state.destroyed) return; state.metricRequest = true;
        if (!state.samples.ops.length) text("metrics-status", _("Loading Valkey metrics…"));
        const config = formValues(); const host = ["0.0.0.0", "::"].includes(config.bind) ? "127.0.0.1" : config.bind;
        try { const output = await spawnWithTimeout(["valkey-cli", "--raw", "-h", host, "-p", config.port, "INFO"], { err: "message" }, 10000); if (state.destroyed) return; const values = parseInfo(output); if (Object.values(values).some(value => !Number.isFinite(value))) throw new Error(_("Valkey returned incomplete metrics."));
            ["ops", "clients", "memory"].forEach(key => { state.samples[key].push(values[key]); if (state.samples[key].length > MAX_SAMPLES) state.samples[key].shift(); }); renderMetrics(values); text("metrics-status", _("Metrics update every 5 seconds."));
        } catch (ex) { if (!state.destroyed) text("metrics-status", _("Could not read Valkey metrics: {error}").replace("{error}", errorText(ex))); }
        finally { state.metricRequest = false; }
    }
    function renderMetrics(values) {
        const labels = { ops: _("Instantaneous operations per second"), clients: _("Connected clients"), memory: _("Used memory") }; const format = { ops: value => String(value), clients: value => String(value), memory: value => `${(value / 1048576).toFixed(2)} MiB` };
        const container = $("metrics"); container.replaceChildren(); Object.keys(labels).forEach(key => { const article = document.createElement("article"); article.className = "metric"; const heading = document.createElement("h3"); heading.textContent = labels[key]; const value = document.createElement("div"); value.className = "metric-value"; value.textContent = format[key](values[key]); const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.classList.add("sparkline"); svg.setAttribute("viewBox", "0 0 100 40"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", _("Recent values for {metric}").replace("{metric}", labels[key])); const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline"); const samples = state.samples[key]; const max = Math.max(...samples, 1); polyline.setAttribute("points", samples.map((sample, index) => `${(index / Math.max(samples.length - 1, 1)) * 100},${38 - (sample / max) * 34}`).join(" ")); svg.append(polyline); article.append(heading, value, svg); container.append(article); });
    }

    function initialize() {
        document.title = _("Valkey"); text("page-title", _("Valkey management")); text("installation-title", _("Installation")); text("install", _("Install Valkey")); text("service-title", _("Service")); text("start", _("Start")); text("stop", _("Stop")); text("restart", _("Restart")); text("refresh", _("Refresh")); text("configuration-title", _("Basic configuration")); text("configuration-help", _("Changes are saved to /etc/valkey/valkey.conf. Restart Valkey for them to take effect.")); text("port-label", _("Port")); text("bind-label", _("Bind address")); text("protected-mode-label", _("Protected mode")); text("protected-yes", _("Yes")); text("protected-no", _("No")); text("maxmemory-label", _("Maximum memory")); text("save", _("Save configuration")); text("metrics-title", _("Live metrics"));
        $("install").addEventListener("click", installPackage); $("start").addEventListener("click", () => serviceAction("Start")); $("stop").addEventListener("click", () => serviceAction("Stop")); $("restart").addEventListener("click", () => serviceAction("Restart")); $("refresh").addEventListener("click", refreshService); $("configuration-form").addEventListener("submit", saveConfig);
        interval(collectMetrics, 5000); detectPackage();
    }
    function teardown() { state.destroyed = true; state.timers.forEach(id => { window.clearTimeout(id); window.clearInterval(id); }); state.serviceSubscription?.remove(); state.spawns.forEach(process => process.close?.()); state.files.forEach(file => file.close?.()); state.dbus.forEach(client => client.close?.()); }
    window.addEventListener("unload", teardown);
    cockpit.transport.wait(() => { document.body.hidden = false; initialize(); });
}());
