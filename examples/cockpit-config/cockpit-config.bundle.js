/* cockpit-config asset revision: cockpit-config-v3 */
"use strict";
(() => {
  // schema.json
  var schema_default = {
    schemaRevision: 2,
    compatibility: "cockpit-config-schema-v2",
    source: "Cockpit configuration editor safe manifest; cockpit.conf(5) is comparison-only",
    sections: [
      { name: "WebService", options: [
        { key: "Origins", type: "text", editable: true, validation: { kind: "origins", maxLength: 4096, allowEmpty: true }, help: "Space-separated origins (scheme, host, optional port; wildcards are supported). Leave empty to unset. Security: restricting this incorrectly can lock out browsers or allow an untrusted origin.", examples: ["https://example.com https://*.example.com"], placeholder: "https://example.com", securityRationale: "Origin syntax is constrained and dangerous changes are called out." },
        { key: "ProtocolHeader", type: "text", editable: true, validation: { kind: "header", maxLength: 256, allowEmpty: true }, help: "Header whose value identifies TLS behind a trusted reverse proxy. Leave empty to unset. Security: only trust a header that outside clients cannot set.", examples: ["X-Forwarded-Proto"], placeholder: "X-Forwarded-Proto", securityRationale: "Header names are strictly validated and proxy trust risk is explicit." },
        { key: "ForwardedForHeader", type: "text", editable: true, validation: { kind: "header", maxLength: 256, allowEmpty: true }, help: "Header that identifies the real client origin behind a trusted reverse proxy. Leave empty to unset. Security: only trust a header that outside clients cannot set.", examples: ["X-Forwarded-For"], placeholder: "X-Forwarded-For", securityRationale: "Header names are strictly validated and proxy trust risk is explicit." },
        { key: "LoginTitle", type: "text", editable: true, validation: { kind: "line", maxLength: 256, allowEmpty: true }, help: "Browser title for the login screen. Leave empty to unset. Security: this is displayed to users and must not contain control characters.", examples: ["Cockpit"], placeholder: "Cockpit", securityRationale: "Displayed text is bounded and control characters are rejected." },
        { key: "LoginTo", type: "boolean", editable: true, validation: { kind: "boolean" }, help: "Allow connecting to remote hosts; when unset, Cockpit detects this from the installed bridge and ssh. Security: explicitly disabling this is recommended when the service can reach private networks.", examples: ["true"], securityRationale: "Boolean policy is bounded, automatic default behavior is preserved, and its network risk is explicit." },
        { key: "RequireHost", type: "boolean", default: false, editable: true, validation: { kind: "boolean" }, help: "Require Connect to to specify a host. Security: this changes login routing.", examples: ["false"], securityRationale: "Boolean policy is bounded and its login impact is explicit." },
        { key: "AllowMultiHost", type: "boolean", editable: true, validation: { kind: "boolean" }, help: "Allow connections to multiple hosts. Security: enable only when all hosts are trusted; connected hosts share JavaScript execution risk.", examples: ["false"], securityRationale: "Boolean policy is bounded and its cross-host risk is explicit." },
        { key: "MaxStartups", type: "structured", editable: true, validation: { kind: "max-startups", maxLength: 64, allowEmpty: true }, help: "Maximum concurrent unauthenticated logins, or start:rate:full random early drop. Leave empty for the default. Security: restrictive values can deny logins.", examples: ["10", "10:30:60"], placeholder: "10 or 10:30:60", securityRationale: "The documented integer or ordered triple is bounded and denial-of-service impact is explicit." },
        { key: "MaxConcurrentConnections", type: "integer", min: 10, max: 4294967295, default: 500, editable: true, validation: { kind: "integer" }, help: "Maximum concurrent HTTP connections. Range: 10\u20134294967295; default: 500. Security: restrictive values can deny access.", examples: ["500"], placeholder: "500", securityRationale: "Bounded integer prevents malformed or unbounded resource settings." },
        { key: "AllowUnencrypted", type: "boolean", default: false, editable: true, validation: { kind: "boolean" }, help: "Accept unencrypted HTTP connections. Security: enabling this weakens transport protection.", examples: ["false"], securityRationale: "Boolean policy is bounded and transport risk is explicit." },
        { key: "UrlRoot", type: "text", editable: true, validation: { kind: "url-root", maxLength: 256, allowEmpty: true }, help: "Root URL path when behind a reverse proxy. Leave empty to unset. Security: a wrong path can disrupt access; /cockpit and /cockpit++ are reserved.", examples: ["/cockpit-new"], placeholder: "/cockpit-new", securityRationale: "Only safe URL-root paths are accepted and routing impact is explicit." },
        { key: "ClientCertAuthentication", type: "boolean", editable: true, validation: { kind: "boolean" }, help: "Enable TLS client certificate authentication. Security: changing authentication can lock out the current session.", examples: ["true"], securityRationale: "Boolean policy is bounded and authentication impact is explicit." },
        { key: "Shell", type: "text", editable: true, validation: { kind: "relative-path", maxLength: 512, allowEmpty: true }, help: "Relative URL of the top-level component after login. Leave empty to unset. Security: a wrong path can disrupt the login session.", examples: ["shell/index.html"], placeholder: "shell/index.html", securityRationale: "Only relative URL paths are accepted and session impact is explicit." },
        { key: "CustomLoginPage", type: "text", editable: true, validation: { kind: "absolute-path", maxLength: 4096, allowEmpty: true }, help: "Alternative login-page directory containing login.html. Leave empty to unset. Security: a wrong or untrusted path can disrupt or compromise login.", examples: ["/usr/share/cockpit/login"], placeholder: "/usr/share/cockpit/login", securityRationale: "Only absolute filesystem paths are accepted and login risk is explicit." }
      ] },
      { name: "Session", options: [
        { key: "Banner", type: "text", editable: true, validation: { kind: "absolute-path", maxLength: 4096, allowEmpty: true }, help: "File shown on the login page. Leave empty to unset. Security: the file contents are exposed to login users.", examples: ["/etc/issue"], placeholder: "/etc/issue", securityRationale: "Only absolute filesystem paths are accepted and disclosure risk is explicit." },
        { key: "IdleTimeout", type: "integer", min: 0, max: 4294967295, editable: true, validation: { kind: "integer" }, help: "Idle timeout in minutes; 0 disables it. Security: larger values leave unattended sessions active longer.", examples: ["15"], placeholder: "15", securityRationale: "Bounded integer prevents malformed timeout settings and explains session risk." },
        { key: "WarnBeforeConnecting", type: "boolean", default: true, editable: true, validation: { kind: "boolean" }, help: "Warn before connecting to remote hosts from the Shell. Security: disabling this removes a user safety warning.", examples: ["true"], securityRationale: "Boolean policy is bounded and user-safety impact is explicit." }
      ] },
      { name: "Log", options: [
        { key: "Fatal", type: "text", editable: true, validation: { kind: "fatal-list", maxLength: 64, allowEmpty: true }, help: "Space-separated fatal log categories: criticals and/or warnings. Leave empty to unset. Security: fatal logging can affect availability.", examples: ["criticals warnings"], placeholder: "criticals warnings", securityRationale: "Only documented categories are accepted and availability impact is explicit." }
      ] },
      { name: "OAuth", options: [
        { key: "URL", type: "text", editable: true, validation: { kind: "https-url", maxLength: 2048, allowEmpty: true }, help: "OAuth provider URL. Leave empty to unset. Security: changing it can redirect credentials to an untrusted provider or break login.", examples: ["https://auth.example.com/authorize"], placeholder: "https://auth.example.com/authorize", securityRationale: "Only HTTP(S) URLs are accepted and provider/login risk is explicit." },
        { key: "ErrorParam", type: "text", editable: true, validation: { kind: "token", maxLength: 64, allowEmpty: true }, help: "OAuth error parameter name. Leave empty for the documented default. Security: changing protocol parameters can break authentication.", examples: ["error_description"], placeholder: "error_description", securityRationale: "Parameter names use a strict token grammar and authentication impact is explicit." },
        { key: "TokenParam", type: "text", editable: true, validation: { kind: "token", maxLength: 64, allowEmpty: true }, help: "OAuth access-token parameter name. Leave empty for the documented default. Security: changing protocol parameters can break or misroute authentication.", examples: ["access_token"], placeholder: "access_token", securityRationale: "Parameter names use a strict token grammar and authentication impact is explicit." }
      ] }
    ]
  };

  // parser.js
  var supportedTypes = /* @__PURE__ */ new Set(["boolean", "integer", "text", "structured"]);
  var id = (item) => `${item.section}.${item.key}`;
  function validateSchema(candidate) {
    if (!candidate || !Number.isInteger(candidate.schemaRevision) || candidate.schemaRevision < 1)
      throw new Error("Schema revision must be a positive integer");
    if (!candidate.compatibility || typeof candidate.compatibility !== "string")
      throw new Error("Schema compatibility metadata is required");
    if (!candidate.source || typeof candidate.source !== "string")
      throw new Error("Schema source metadata is required");
    if (!Array.isArray(candidate.sections) || !candidate.sections.length)
      throw new Error("Schema must define at least one section");
    const sections = /* @__PURE__ */ new Set(), options = /* @__PURE__ */ new Set(), flattened = [];
    for (const section of candidate.sections) {
      if (!section || typeof section.name !== "string" || !section.name.trim())
        throw new Error("Schema section names are required");
      if (sections.has(section.name.toLowerCase()))
        throw new Error(`Duplicate schema section: ${section.name}`);
      sections.add(section.name.toLowerCase());
      if (!Array.isArray(section.options) || !section.options.length)
        throw new Error(`Schema section has no options: ${section.name}`);
      for (const option of section.options) {
        if (!option || typeof option.key !== "string" || !option.key.trim())
          throw new Error(`Schema option key is required in [${section.name}]`);
        const optionId = `${section.name}.${option.key}`;
        if (options.has(optionId.toLowerCase()))
          throw new Error(`Duplicate schema option: ${optionId}`);
        options.add(optionId.toLowerCase());
        if (!supportedTypes.has(option.type))
          throw new Error(`Unsupported schema type for ${optionId}: ${option.type}`);
        if (typeof option.help !== "string" || !option.help.trim())
          throw new Error(`Schema help is required for ${optionId}`);
        if ((!Array.isArray(option.examples) || !option.examples.length) && !(typeof option.placeholder === "string" && option.placeholder.trim()))
          throw new Error(`Schema example or placeholder is required for ${optionId}`);
        if (typeof option.editable !== "boolean")
          throw new Error(`Schema edit policy is required for ${optionId}`);
        if (option.editable && (!option.validation || typeof option.validation !== "object" || typeof option.validation.kind !== "string"))
          throw new Error(`Validation metadata is required for editable option: ${optionId}`);
        if (option.editable && ["text", "structured"].includes(option.type) && (!Number.isSafeInteger(option.validation.maxLength) || option.validation.maxLength < 1 || option.validation.maxLength > 16384))
          throw new Error(`Validation length is required for editable option: ${optionId}`);
        if (option.editable && typeof option.securityRationale !== "string" || option.editable && !option.securityRationale.trim())
          throw new Error(`Security rationale is required for editable option: ${optionId}`);
        if (!option.editable && (typeof option.readOnlyRationale !== "string" || !option.readOnlyRationale.trim()))
          throw new Error(`Read-only rationale is required for ${optionId}`);
        if (option.type === "integer" && (!Number.isSafeInteger(option.min) || !Number.isSafeInteger(option.max) || option.min < 0 || option.min > option.max))
          throw new Error(`Invalid integer bounds for ${optionId}`);
        if (option.default !== void 0 && (option.type === "boolean" && typeof option.default !== "boolean" || option.type === "integer" && (!Number.isSafeInteger(option.default) || option.default < option.min || option.default > option.max)))
          throw new Error(`Invalid schema default for ${optionId}`);
        flattened.push({ section: section.name, ...option });
      }
    }
    return flattened;
  }
  var SCHEMA_METADATA = { revision: schema_default.schemaRevision, compatibility: schema_default.compatibility, source: schema_default.source };
  var STATIC_SCHEMA = validateSchema(schema_default);
  var keyRE = /^[ \t]*([^#;\s][^=:\s]*?)\s*(?:=|:)\s*(.*?)\s*$/;
  var bools = /* @__PURE__ */ new Map([["true", "true"], ["yes", "true"], ["1", "true"], ["false", "false"], ["no", "false"], ["0", "false"]]);
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
  function valuesFor(content, schema = STATIC_SCHEMA) {
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
  function validationError(item, raw) {
    const value = String(raw ?? "");
    const rule = item.validation;
    if (value.length > rule.maxLength)
      return `Use at most ${rule.maxLength} characters.`;
    if (/\r|\n|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))
      return "Control characters and line breaks are not allowed.";
    if (!value && rule.allowEmpty)
      return null;
    if (!value)
      return "A value is required.";
    switch (rule.kind) {
      case "boolean":
        return normalizeBoolean(value) ? null : "Use true, false, yes, no, 1, or 0.";
      case "integer":
        return !/^[0-9]+$/.test(value.trim()) || !Number.isSafeInteger(Number(value)) || Number(value) < item.min || Number(value) > item.max ? `Enter a whole number from ${item.min} to ${item.max}.` : null;
      case "header":
        return /^[A-Za-z][A-Za-z0-9-]*$/.test(value) ? null : "Enter an HTTP header name.";
      case "token":
        return /^[A-Za-z][A-Za-z0-9_.-]*$/.test(value) ? null : "Enter a parameter name using letters, numbers, dots, hyphens, or underscores.";
      case "line":
        return /[;#]/.test(value) ? "The value cannot contain comment characters." : null;
      case "fatal-list":
        return /^(?:criticals|warnings)(?: +(criticals|warnings))*$/.test(value) ? null : "Use a space-separated list containing only criticals and warnings.";
      case "max-startups": {
        if (/^[0-9]+$/.test(value))
          return Number(value) <= 4294967295 ? null : "Enter a number from 0 to 4294967295.";
        const parts = value.split(":");
        if (parts.length !== 3 || parts.some((part) => !/^[0-9]+$/.test(part)))
          return "Use a number or start:rate:full.";
        const [start, rate, full] = parts.map(Number);
        return start <= 4294967295 && rate >= 1 && rate <= 100 && full <= 4294967295 && start <= full ? null : "Use start:rate:full with start \u2264 full and rate from 1 to 100.";
      }
      case "url-root":
        return /^\/(?!cockpit(?:\/|\+|$))(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]*$/.test(value) ? null : "Enter a URL path other than reserved /cockpit or /cockpit+ forms.";
      case "relative-path":
        return /^(?!\/)(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/.test(value) ? null : "Enter a relative URL path.";
      case "absolute-path":
        return /^\/(?:[^\0\r\n/]+\/)*[^\0\r\n/]*$/.test(value) && !/[;#]/.test(value) ? null : "Enter an absolute filesystem path without comment characters.";
      case "origins": {
        const host = "(?:\\\\[[0-9A-Fa-f:.%*?]+\\\\]|[A-Za-z0-9*?._~-]+)";
        const origin = new RegExp(`^https?:\\/\\/${host}(?::[0-9]{1,5})?$`);
        return value.trim().split(/\s+/).every((candidate) => origin.test(candidate)) ? null : "Use space-separated HTTP(S) origins with a host and optional port, without paths.";
      }
      case "https-url":
        try {
          const url = new URL(value);
          return ["http:", "https:"].includes(url.protocol) ? null : "Use an HTTP or HTTPS URL.";
        } catch {
          return "Enter a valid HTTP or HTTPS URL.";
        }
      default:
        return "This option has no recognized validator.";
    }
  }
  function validateChanges(changes, schema = STATIC_SCHEMA) {
    const errors = {};
    for (const item of schema.filter((item2) => item2.editable)) {
      const value = changes[id(item)];
      if (value === void 0)
        continue;
      const error = validationError(item, value);
      if (error)
        errors[id(item)] = error;
    }
    return errors;
  }
  function parseRenderedMan(output, schema = STATIC_SCHEMA) {
    const knownSections = new Set(schema.map((item) => item.section));
    const documented = /* @__PURE__ */ new Set(), lines = String(output ?? "").split(/\r?\n/);
    let section = null, headings = 0;
    for (let i = 0; i < lines.length; i++) {
      const heading = lines[i].match(/^\s{0,3}([A-Za-z][A-Za-z0-9]*)\s*$/);
      if (heading && knownSections.has(heading[1])) {
        section = heading[1];
        headings++;
        continue;
      }
      const option = lines[i].match(/^\s{4,12}([A-Z][A-Za-z0-9]+)\s*$/);
      if (section && option && lines[i + 1]?.match(/^\s{8,}/))
        documented.add(`${section}.${option[1]}`);
    }
    const expected = new Set(schema.map(id));
    const missing = [...expected].filter((option) => !documented.has(option));
    const extra = [...documented].filter((option) => !expected.has(option));
    return { available: true, malformed: headings === 0, headings, documented: [...documented], missing, extra, mismatch: headings === 0 || missing.length > 0 || extra.length > 0 };
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
      const change = item.type === "boolean" ? normalizeBoolean(raw) : item.type === "integer" ? String(raw).trim() : String(raw);
      const parsed = parseConfig(lines.join("\n"));
      const matches = parsed.sections.filter((section2) => section2.name.toLowerCase() === item.section.toLowerCase());
      if (matches.length > 1)
        throw new Error(`Duplicate managed section: [${item.section}]`);
      const section = matches[0], keys = section?.keys.filter((key) => key.name.toLowerCase() === item.key.toLowerCase()) ?? [];
      if (keys.length > 1)
        throw new Error(`Duplicate managed directive: [${item.section}] ${item.key}`);
      if (keys[0] && change === "") {
        const comment = lines[keys[0].line].match(/[ \t]+([#;].*)$/);
        if (comment)
          lines[keys[0].line] = `${lines[keys[0].line].match(/^\s*/)[0]}${comment[1]}`;
        else
          lines.splice(keys[0].line, 1);
        const sectionStart = section.line;
        const sectionEnd = lines.findIndex((line, index) => index > sectionStart && /^\s*\[[^\]]+\]\s*(?:[#;].*)?$/.test(line));
        const end = sectionEnd < 0 ? lines.length : sectionEnd;
        if (section && lines.slice(sectionStart + 1, end).every((line) => !line.trim()))
          lines.splice(sectionStart, end - sectionStart);
      } else if (keys[0])
        lines[keys[0].line] = lines[keys[0].line].replace(/([ \t]*=[ \t]*|[ \t]*:[ \t]*|[ \t]+)[^#;]*?([ \t]+[#;].*)?$/, (_2, prefix, comment = "") => `${prefix}${change}${comment}`);
      else if (change === "")
        continue;
      else if (section)
        lines.splice(section.line + 1, 0, `${item.key} = ${change}`);
      else {
        if (lines.length && lines.at(-1) !== "")
          lines.push("");
        lines.push(`[${item.section}]`, `${item.key} = ${change}`);
      }
    }
    let result = lines.join(newline);
    if (result)
      result = result.replace(/[\r\n]*$/, "") + (hadFinalNewline || !source ? newline : "");
    return result;
  }

  // save-flow.js
  var canSave = (state2) => Boolean(state2.domReady && state2.loaded && state2.file);
  var missingRequiredIds = (presentIds, requiredIds) => requiredIds.filter((id2) => !presentIds.has(id2));
  var assetRevisionMatches = (htmlRevision, bundleRevision) => Boolean(htmlRevision && htmlRevision === bundleRevision);
  async function modifyAndRefresh(file, updater, refresh) {
    try {
      await file.modify(updater);
    } catch (error) {
      return { saved: false, error };
    }
    try {
      await refresh();
      return { saved: true };
    } catch (error) {
      return { saved: true, refreshError: error };
    }
  }

  // cockpit-config.js
  var _ = cockpit.gettext;
  var DEFAULT_PATH = "/etc/cockpit/cockpit.conf";
  var ASSET_REVISION = "cockpit-config-v3";
  var $ = (id2) => document.getElementById(id2);
  var state = { schema: STATIC_SCHEMA, content: null, file: null, path: DEFAULT_PATH, presence: {}, initial: {}, busy: false, domReady: false, loaded: false, edited: /* @__PURE__ */ new Set() };
  var errorText = (ex) => ex?.message || ex?.problem || String(ex);
  var message = (template, ex) => template.replace("{error}", errorText(ex));
  var inputId = (item) => `option-${item.section}-${item.key}`.replace(/[^A-Za-z0-9_-]/g, "-");
  var REQUIRED_IDS = ["global-status", "editable-grid", "readonly-grid", "editable-state", "readonly-state", "path-status", "title", "description", "security-warning", "path-label", "tab-list", "tab-editable", "tab-readonly", "panel-editable", "panel-readonly", "save", "refresh"];
  function checkDomContract() {
    const missing = missingRequiredIds(new Set(REQUIRED_IDS.filter((id2) => $(id2))), REQUIRED_IDS);
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
  function setBusy(busy) {
    state.busy = busy;
    document.querySelectorAll("button, input").forEach((control) => {
      control.disabled = busy || control.id === "save" && !state.loaded;
    });
  }
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
      const help = document.createElement("p");
      help.className = "pf-v6-c-form__helper-text";
      help.id = `${id2}-help`;
      help.textContent = _(item.help);
      if (item.editable) {
        const input = document.createElement("input");
        input.className = item.type === "boolean" ? "pf-v6-c-check__input" : "pf-v6-c-form-control";
        input.id = id2;
        input.dataset.option = option;
        input.setAttribute("aria-describedby", help.id);
        input.type = item.type === "boolean" ? "checkbox" : item.type === "integer" ? "number" : "text";
        if (item.validation?.maxLength)
          input.maxLength = item.validation.maxLength;
        if (item.type === "integer") {
          input.min = item.min;
          input.max = item.max;
          input.step = "1";
        }
        if (item.type !== "boolean") {
          input.value = parsed.values[option] || "";
          input.placeholder = item.placeholder || item.examples?.[0] || "";
        } else
          input.checked = parsed.presence[option] ? normalizeBoolean(parsed.values[option]) === "true" : item.default === true;
        input.addEventListener("input", () => state.edited.add(option));
        input.addEventListener("change", () => state.edited.add(option));
        if (item.type === "boolean") {
          const check = document.createElement("div");
          check.className = "pf-v6-c-check";
          const label = document.createElement("label");
          label.className = "pf-v6-c-check__label";
          label.htmlFor = id2;
          label.textContent = item.key;
          check.append(input, label);
          field.append(check, help);
        } else {
          const label = document.createElement("label");
          label.className = "pf-v6-c-form__label";
          label.htmlFor = id2;
          label.textContent = item.key;
          field.append(label, help, input);
        }
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
        changes[input.dataset.option] = input.type === "checkbox" ? input.checked ? "true" : "false" : input.value;
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
        input.closest(".pf-v6-c-form__group").append(node);
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
    state.loaded = false;
    state.edited.clear();
    state.file = null;
    status(_("Loading cockpit.conf and its schema\u2026"));
    try {
      const discovered = await discoverSchema();
      state.schema = discovered.schema;
      state.path = await configPath();
      state.file = cockpit.file(state.path, { superuser: "require", err: "message" });
      state.content = await state.file.read();
      const parsed = valuesFor(state.content || "", state.schema);
      state.initial = parsed.values;
      state.presence = parsed.presence;
      render(state.schema, parsed);
      $("path-status").textContent = state.path;
      state.loaded = true;
      const loaded = state.content === null ? _("The active file does not exist yet; saving will create it.") : _("Configuration loaded.");
      status(`${loaded} ${documentationStatus(discovered.documentation)}`, discovered.documentation.mismatch);
    } catch (ex) {
      state.file = null;
      state.loaded = false;
      status(message(_("Could not load the configuration: {error}"), ex), true);
      $("editable-grid")?.replaceChildren();
      $("readonly-grid")?.replaceChildren();
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!canSave(state)) {
      status(_("Cannot save because the configuration was not loaded successfully."), true);
      return;
    }
    const changes = formChanges(), errors = validateChanges(changes, state.schema);
    if (showValidation(errors)) {
      status(_("Correct the highlighted fields before saving."), true);
      return;
    }
    setBusy(true);
    status(_("Saving configuration\u2026"));
    const result = await modifyAndRefresh(state.file, (old) => updateConfig(old, changes, state.schema), async () => {
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
      } finally {
        dbus?.close();
      }
    });
    if (!result.saved)
      status(message(_("Configuration was not saved: {error}"), result.error), true);
    else if (result.refreshError)
      status(message(_("Configuration was saved, but the UI could not refresh: {error}"), result.refreshError), true);
    else
      status(_("Configuration saved and cockpit.service reloaded."));
    setBusy(false);
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
    checkDomContract();
    checkAssetContract();
    state.domReady = true;
    document.title = _("Cockpit configuration");
    $("title").textContent = _("Cockpit configuration");
    $("description").textContent = _("Review and safely edit supported options. Administrator rights are required.");
    $("security-warning").textContent = _("Security warning: changing authentication, origins, proxy headers, OAuth, or paths may lock you out or disrupt the current session. Changes are applied immediately when saved.");
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
