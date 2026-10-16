"use strict";
(() => {
  // parser.js
  var STATIC_SCHEMA = [
    { section: "WebService", key: "LoginTo", type: "boolean", editable: true, help: "Allow connecting to remote hosts. Accepted values: true/false, yes/no, or 1/0. Security: set false when this service can reach private networks." },
    { section: "WebService", key: "RequireHost", type: "boolean", editable: true, help: "Require the Connect to option to specify a host. Accepted values: true/false, yes/no, or 1/0. Default: false." },
    { section: "WebService", key: "AllowMultiHost", type: "boolean", editable: true, help: "Allow connections to multiple hosts. Accepted values: true/false, yes/no, or 1/0. Security: use only when all connected hosts are trusted." },
    { section: "WebService", key: "AllowUnencrypted", type: "boolean", editable: true, help: "Accept unencrypted HTTP connections. Accepted values: true/false, yes/no, or 1/0. Security: HTTPS is recommended; default: false." },
    { section: "WebService", key: "ClientCertAuthentication", type: "boolean", editable: true, help: "Enable TLS client certificate authentication. Accepted values: true/false, yes/no, or 1/0." },
    { section: "WebService", key: "MaxConcurrentConnections", type: "integer", min: 10, max: 4294967295, editable: true, help: "Maximum concurrent HTTP connections. Range: 10\u20134294967295; default: 500." },
    { section: "Session", key: "IdleTimeout", type: "integer", min: 0, max: 4294967295, editable: true, help: "Idle timeout in minutes; 0 disables it. Range: 0\u20134294967295; default: unset." },
    { section: "Session", key: "WarnBeforeConnecting", type: "boolean", editable: true, help: "Warn before connecting to remote hosts. Accepted values: true/false, yes/no, or 1/0; default: true." },
    { section: "WebService", key: "Origins", type: "text", editable: false, help: "Read-only: origins use wildcard and IPv6 escaping rules. Security: restrict origins carefully." },
    { section: "WebService", key: "ProtocolHeader", type: "text", editable: false, help: "Read-only: reverse-proxy security behavior. Only trust this header behind a trusted proxy." },
    { section: "WebService", key: "ForwardedForHeader", type: "text", editable: false, help: "Read-only: reverse-proxy security behavior. Only trust this header behind a trusted proxy." },
    { section: "WebService", key: "UrlRoot", type: "text", editable: false, help: "Read-only: reserved URL path restrictions apply." },
    { section: "WebService", key: "LoginTitle", type: "text", editable: false, help: "Read-only: free-form browser title." },
    { section: "WebService", key: "Shell", type: "text", editable: false, help: "Read-only: relative URL to a Cockpit shell component." },
    { section: "WebService", key: "CustomLoginPage", type: "text", editable: false, help: "Read-only: alternate page directory." },
    { section: "Log", key: "Fatal", type: "text", editable: false, help: "Read-only: space-separated fatal log categories." },
    { section: "OAuth", key: "URL", type: "text", editable: false, help: "Read-only: OAuth provider URL. Security: protect the provider and redirect URI." },
    { section: "OAuth", key: "ErrorParam", type: "text", editable: false, help: "Read-only: OAuth error parameter." },
    { section: "OAuth", key: "TokenParam", type: "text", editable: false, help: "Read-only: OAuth token parameter." },
    { section: "Session", key: "Banner", type: "text", editable: false, help: "Read-only: file displayed on the login page." }
  ];
  var keyRE = /^[ \t]*([^#;\s][^=:\s]*?)\s*(?:=|:)\s*(.*?)\s*$/;
  var bools = /* @__PURE__ */ new Map([["true", "true"], ["yes", "true"], ["1", "true"], ["false", "false"], ["no", "false"], ["0", "false"]]);
  var id = (item) => `${item.section}.${item.key}`;
  function parseConfig(content) {
    const sections = [];
    let current = null;
    for (const [index, line] of String(content ?? "").split(/\r?\n/).entries()) {
      const section = line.match(/^\s*\[([^\]]+)\]\s*(?:[#;].*)?$/);
      if (section) {
        current = { name: section[1].trim(), line: index, keys: [] };
        sections.push(current);
        continue;
      }
      const match = current && line.match(keyRE);
      if (match && !line.trimStart().startsWith("#") && !line.trimStart().startsWith(";"))
        current.keys.push({ name: match[1], value: match[2], line: index });
    }
    return { sections };
  }
  function valuesFor(content, schema) {
    const parsed = parseConfig(content), values = {}, presence = {};
    for (const item of schema) {
      const found = parsed.sections.flatMap((section) => section.name.toLowerCase() === item.section.toLowerCase() ? section.keys.filter((key) => key.name.toLowerCase() === item.key.toLowerCase()) : []);
      if (found.length > 1)
        throw new Error(`Duplicate managed directive: [${item.section}] ${item.key}`);
      presence[id(item)] = Boolean(found[0]);
      const value = found[0]?.value ?? "";
      values[id(item)] = item.type === "text" ? value : value.replace(/[ \t]+[#;].*$/, "").trim();
    }
    return { values, presence };
  }
  function normalizeBoolean(value) {
    return bools.get(String(value).trim().toLowerCase());
  }
  function validateChanges(changes, schema = STATIC_SCHEMA) {
    const errors = {};
    for (const item of schema.filter((item2) => item2.editable)) {
      const value = changes[id(item)];
      if (value === void 0)
        continue;
      if (item.type === "boolean" && !normalizeBoolean(value))
        errors[id(item)] = "Use true, false, yes, no, 1, or 0.";
      if (item.type === "integer" && (!/^[0-9]+$/.test(String(value).trim()) || Number(value) < item.min || Number(value) > item.max))
        errors[id(item)] = `Enter a whole number from ${item.min} to ${item.max}.`;
    }
    return errors;
  }
  function parseRenderedMan(output, schema = STATIC_SCHEMA) {
    const knownSections = new Set(schema.map((item) => item.section));
    const known = new Set(schema.map(id));
    const found = [];
    let section = null;
    const lines = String(output ?? "").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const heading = line.match(/^\s{0,3}([A-Za-z][A-Za-z0-9]*)\s*$/);
      if (heading && knownSections.has(heading[1])) {
        section = heading[1];
        continue;
      }
      const option = line.match(/^\s{4,12}([A-Z][A-Za-z0-9]+)\s*$/);
      if (section && option && lines[i + 1]?.match(/^\s{8,}/) && !known.has(`${section}.${option[1]}`)) {
        found.push({ section, key: option[1], type: "text", editable: false, help: "Read-only: cockpit.conf(5) did not establish this option's type or safety." });
      }
    }
    return found;
  }
  function updateConfig(content, changes, schema = STATIC_SCHEMA) {
    const errors = validateChanges(changes, schema);
    if (Object.keys(errors).length)
      throw new Error(Object.entries(errors).map(([key, error]) => `${key}: ${error}`).join("; "));
    const source = String(content ?? ""), newline = source.includes("\r\n") ? "\r\n" : "\n";
    const hadFinalNewline = source.endsWith("\n"), lines = source ? source.split(/\r?\n/) : [];
    for (const item of schema.filter((item2) => item2.editable)) {
      const raw = changes[id(item)];
      if (raw === void 0)
        continue;
      const change = item.type === "boolean" ? normalizeBoolean(raw) : String(raw).trim();
      const parsed = parseConfig(lines.join("\n"));
      const matches = parsed.sections.filter((section2) => section2.name.toLowerCase() === item.section.toLowerCase());
      if (matches.length > 1)
        throw new Error(`Duplicate managed section: [${item.section}]`);
      const section = matches[0], keys = section?.keys.filter((key) => key.name.toLowerCase() === item.key.toLowerCase()) ?? [];
      if (keys.length > 1)
        throw new Error(`Duplicate managed directive: [${item.section}] ${item.key}`);
      if (keys[0])
        lines[keys[0].line] = lines[keys[0].line].replace(/([ \t]*=[ \t]*|[ \t]*:[ \t]*|[ \t]+)[^#;]*?([ \t]+[#;].*)?$/, `$1${change}$2`);
      else if (section)
        lines.splice(section.line + 1, 0, `${item.key} = ${change}`);
      else {
        if (lines.length && lines.at(-1) !== "")
          lines.push("");
        lines.push(`[${item.section}]`, `${item.key} = ${change}`);
      }
    }
    let result = lines.join(newline);
    if (source || hadFinalNewline || result)
      result = result.replace(/[\r\n]*$/, "") + (hadFinalNewline || !source ? newline : "");
    return result;
  }

  // cockpit-config.js
  var _ = cockpit.gettext;
  var DEFAULT_PATH = "/etc/cockpit/cockpit.conf";
  var $ = (id2) => document.getElementById(id2);
  var state = { schema: STATIC_SCHEMA, content: null, file: null, path: DEFAULT_PATH, presence: {}, initial: {}, busy: false, edited: /* @__PURE__ */ new Set() };
  var errorText = (ex) => ex?.message || ex?.problem || String(ex);
  var message = (template, ex) => template.replace("{error}", errorText(ex));
  var inputId = (item) => `option-${item.section}-${item.key}`.replace(/[^A-Za-z0-9_-]/g, "-");
  async function configPath() {
    let dirs = ["/etc"];
    try {
      const output = await cockpit.spawn(["printenv", "XDG_CONFIG_DIRS"], { err: "message" });
      if (output.trim())
        dirs.push(...output.trim().split(":").filter(Boolean));
    } catch {
    }
    const candidates = dirs.map((dir) => `${dir}/cockpit/cockpit.conf`);
    for (const path of candidates) {
      const file = cockpit.file(path, { superuser: "require", err: "message" });
      try {
        if (await file.read() !== null)
          return path;
      } catch {
      } finally {
        file.close();
      }
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
  function setBusy(busy) {
    state.busy = busy;
    document.querySelectorAll("button, input").forEach((control) => {
      control.disabled = busy;
    });
  }
  function status(text, error = false) {
    $("global-status").textContent = text;
    $("global-status").classList.toggle("pf-m-danger", error);
  }
  function render(schema, parsed) {
    const editable = $("editable-grid"), readonly = $("readonly-grid");
    editable.replaceChildren();
    readonly.replaceChildren();
    const groups = /* @__PURE__ */ new Map();
    for (const item of schema) {
      const target = item.editable ? editable : readonly, group = `${item.editable}:${item.section}`;
      if (!groups.has(group)) {
        const card = document.createElement("section");
        card.className = "pf-v6-c-card";
        card.setAttribute("aria-labelledby", `${item.editable ? "editable" : "readonly"}-${item.section}`);
        const header = document.createElement("div");
        header.className = "pf-v6-c-card__header";
        const title = document.createElement("h2");
        title.className = "pf-v6-c-card__title pf-v6-c-title pf-m-lg";
        title.id = `${item.editable ? "editable" : "readonly"}-${item.section}`;
        title.textContent = `[${item.section}]`;
        header.append(title);
        const body = document.createElement("div");
        body.className = "pf-v6-c-card__body";
        card.append(header, body);
        target.append(card);
        groups.set(group, body);
      }
      const field = document.createElement("div");
      field.className = "pf-v6-c-form__group";
      const id2 = inputId(item), option = `${item.section}.${item.key}`;
      const label = document.createElement("label");
      label.className = "pf-v6-c-form__label";
      label.htmlFor = id2;
      label.textContent = item.key;
      field.append(label);
      const help = document.createElement("p");
      help.className = "pf-v6-c-form__helper-text";
      help.id = `${id2}-help`;
      help.textContent = _(item.help);
      field.append(help);
      if (item.editable) {
        const input = document.createElement("input");
        input.className = "pf-v6-c-form-control";
        input.id = id2;
        input.dataset.option = option;
        input.setAttribute("aria-describedby", help.id);
        input.type = item.type === "boolean" ? "checkbox" : item.type === "integer" ? "number" : "text";
        if (item.type === "integer") {
          input.min = item.min;
          input.max = item.max;
          input.step = "1";
        }
        if (item.type !== "boolean") {
          input.value = parsed.values[option] || "";
          input.placeholder = item.type === "integer" ? _("Example: 15") : _("Example: https://example.com");
        } else
          input.checked = normalizeBoolean(parsed.values[option]) === "true";
        input.addEventListener("input", () => state.edited.add(option));
        input.addEventListener("change", () => state.edited.add(option));
        field.append(input);
      } else {
        const value = document.createElement("code");
        value.className = "readonly";
        value.textContent = parsed.values[option] || _("not set");
        field.append(value);
      }
      groups.get(group).append(field);
    }
    $("editable-state").textContent = schema.some((item) => item.editable) ? "" : _("No safely editable options were found.");
    $("readonly-state").textContent = schema.some((item) => !item.editable) ? "" : _("No read-only options were found.");
  }
  function formChanges() {
    const changes = {};
    for (const input of document.querySelectorAll("[data-option]"))
      if (state.edited.has(input.dataset.option))
        changes[input.dataset.option] = input.type === "checkbox" ? input.checked ? "true" : "false" : input.value.trim();
    return changes;
  }
  function showValidation(errors) {
    let first = null;
    for (const input of document.querySelectorAll("[data-option]")) {
      const error = errors[input.dataset.option];
      input.setAttribute("aria-invalid", error ? "true" : "false");
      const errorId = `${input.id}-error`;
      document.getElementById(errorId)?.remove();
      if (error) {
        const node = document.createElement("p");
        node.id = errorId;
        node.className = "config-field-error";
        node.textContent = _(error);
        input.after(node);
        input.setAttribute("aria-describedby", `${input.id}-help ${errorId}`);
        first ||= input;
      } else
        input.setAttribute("aria-describedby", `${input.id}-help`);
    }
    first?.focus();
    return Boolean(first);
  }
  async function load() {
    setBusy(true);
    state.edited.clear();
    status(_("Loading cockpit.conf and its schema\u2026"));
    try {
      state.schema = await discoverSchema();
      state.path = await configPath();
      state.file = cockpit.file(state.path, { superuser: "require", err: "message" });
      state.content = await state.file.read();
      const parsed = valuesFor(state.content || "", state.schema);
      state.initial = parsed.values;
      state.presence = parsed.presence;
      render(state.schema, parsed);
      $("path-status").textContent = state.path;
      status(state.content === null ? _("The active file does not exist yet; saving will create it.") : _("Configuration loaded."));
    } catch (ex) {
      status(message(_("Could not load the configuration: {error}"), ex), true);
      $("editable-grid").replaceChildren();
      $("readonly-grid").replaceChildren();
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    const changes = formChanges(), errors = validateChanges(changes, state.schema);
    if (showValidation(errors)) {
      status(_("Correct the highlighted fields before saving."), true);
      return;
    }
    setBusy(true);
    status(_("Saving configuration\u2026"));
    try {
      await state.file.modify((old) => updateConfig(old, changes, state.schema));
      state.content = await state.file.read();
      const parsed = valuesFor(state.content || "", state.schema);
      state.initial = parsed.values;
      state.presence = parsed.presence;
      state.edited.clear();
      render(state.schema, parsed);
      let dbus;
      try {
        dbus = cockpit.dbus("org.freedesktop.systemd1", { superuser: "require", track: true });
        await dbus.call("/org/freedesktop/systemd1", "org.freedesktop.systemd1.Manager", "ReloadUnit", ["cockpit.service", "replace"], { type: "ss" });
        status(_("Configuration saved and cockpit.service reloaded."));
      } catch (ex) {
        status(message(_("Configuration saved, but cockpit.service reload failed (ExecReload may be unsupported): {error}"), ex), true);
      } finally {
        dbus?.close();
      }
    } catch (ex) {
      status(message(_("Configuration was not saved: {error}"), ex), true);
    } finally {
      setBusy(false);
    }
  }
  function setupTabs() {
    const tabs = [["tab-editable", "panel-editable"], ["tab-readonly", "panel-readonly"]];
    function activate(id2) {
      tabs.forEach(([tabId, panelId]) => {
        const selected = tabId === id2;
        $(tabId).setAttribute("aria-selected", selected);
        $(tabId).tabIndex = selected ? 0 : -1;
        $(tabId).parentElement.classList.toggle("pf-m-current", selected);
        $(panelId).hidden = !selected;
      });
    }
    tabs.forEach(([tabId], index) => {
      const tab = $(tabId);
      tab.addEventListener("click", () => activate(tabId));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate(tabId);
          return;
        }
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
          next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = (index + tabs.length - 1) % tabs.length;
        if (event.key === "Home")
          next = 0;
        if (event.key === "End")
          next = tabs.length - 1;
        if (next !== null) {
          event.preventDefault();
          $(tabs[next][0]).focus();
          activate(tabs[next][0]);
        }
      });
    });
  }
  function init() {
    document.title = _("Cockpit configuration");
    $("title").textContent = _("Cockpit configuration");
    $("description").textContent = _("Review and safely edit supported options. Administrator rights are required.");
    $("path-label").textContent = _("Active configuration file:");
    $("tab-list").setAttribute("aria-label", _("Configuration sections"));
    $("tab-editable").textContent = _("Editable");
    $("tab-readonly").textContent = _("Read-only");
    $("save").textContent = _("Save and reload");
    $("refresh").textContent = _("Refresh");
    setupTabs();
    $("save").addEventListener("click", save);
    $("refresh").addEventListener("click", load);
    load();
  }
  cockpit.transport.wait(() => {
    document.body.hidden = false;
    init();
  });
})();
