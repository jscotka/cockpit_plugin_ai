export const STATIC_SCHEMA = [
    { section: "WebService", key: "LoginTo", type: "boolean", editable: true, help: "Allow connecting to remote hosts. Accepted values: true/false, yes/no, or 1/0. Security: set false when this service can reach private networks." },
    { section: "WebService", key: "RequireHost", type: "boolean", editable: true, help: "Require the Connect to option to specify a host. Accepted values: true/false, yes/no, or 1/0. Default: false." },
    { section: "WebService", key: "AllowMultiHost", type: "boolean", editable: true, help: "Allow connections to multiple hosts. Accepted values: true/false, yes/no, or 1/0. Security: use only when all connected hosts are trusted." },
    { section: "WebService", key: "AllowUnencrypted", type: "boolean", editable: true, help: "Accept unencrypted HTTP connections. Accepted values: true/false, yes/no, or 1/0. Security: HTTPS is recommended; default: false." },
    { section: "WebService", key: "ClientCertAuthentication", type: "boolean", editable: true, help: "Enable TLS client certificate authentication. Accepted values: true/false, yes/no, or 1/0." },
    { section: "WebService", key: "MaxConcurrentConnections", type: "integer", min: 10, max: 4294967295, editable: true, help: "Maximum concurrent HTTP connections. Range: 10–4294967295; default: 500." },
    { section: "Session", key: "IdleTimeout", type: "integer", min: 0, max: 4294967295, editable: true, help: "Idle timeout in minutes; 0 disables it. Range: 0–4294967295; default: unset." },
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
    { section: "Session", key: "Banner", type: "text", editable: false, help: "Read-only: file displayed on the login page." },
];

const keyRE = /^[ \t]*([^#;\s][^=:\s]*?)\s*(?:=|:)\s*(.*?)\s*$/;
const bools = new Map([["true", "true"], ["yes", "true"], ["1", "true"], ["false", "false"], ["no", "false"], ["0", "false"]]);
const id = item => `${item.section}.${item.key}`;

export function parseConfig(content) {
    const sections = []; let current = null;
    for (const [index, line] of String(content ?? "").split(/\r?\n/).entries()) {
        const section = line.match(/^\s*\[([^\]]+)\]\s*(?:[#;].*)?$/);
        if (section) { current = { name: section[1].trim(), line: index, keys: [] }; sections.push(current); continue; }
        const match = current && line.match(keyRE);
        if (match && !line.trimStart().startsWith("#") && !line.trimStart().startsWith(";")) current.keys.push({ name: match[1], value: match[2], line: index });
    }
    return { sections };
}

export function valuesFor(content, schema) {
    const parsed = parseConfig(content), values = {}, presence = {};
    for (const item of schema) {
        const found = parsed.sections.flatMap(section => section.name.toLowerCase() === item.section.toLowerCase() ? section.keys.filter(key => key.name.toLowerCase() === item.key.toLowerCase()) : []);
        if (found.length > 1) throw new Error(`Duplicate managed directive: [${item.section}] ${item.key}`);
        presence[id(item)] = Boolean(found[0]);
        const value = found[0]?.value ?? "";
        values[id(item)] = item.type === "text" ? value : value.replace(/[ \t]+[#;].*$/, "").trim();
    }
    return { values, presence };
}

export function normalizeBoolean(value) { return bools.get(String(value).trim().toLowerCase()); }

export function validateChanges(changes, schema = STATIC_SCHEMA) {
    const errors = {};
    for (const item of schema.filter(item => item.editable)) {
        const value = changes[id(item)];
        if (value === undefined) continue;
        if (item.type === "boolean" && !normalizeBoolean(value)) errors[id(item)] = "Use true, false, yes, no, 1, or 0.";
        if (item.type === "integer" && (!/^[0-9]+$/.test(String(value).trim()) || Number(value) < item.min || Number(value) > item.max))
            errors[id(item)] = `Enter a whole number from ${item.min} to ${item.max}.`;
    }
    return errors;
}

export function parseRenderedMan(output, schema = STATIC_SCHEMA) {
    const knownSections = new Set(schema.map(item => item.section));
    const known = new Set(schema.map(id)); const found = []; let section = null;
    const lines = String(output ?? "").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const heading = line.match(/^\s{0,3}([A-Za-z][A-Za-z0-9]*)\s*$/);
        if (heading && knownSections.has(heading[1])) { section = heading[1]; continue; }
        // groff's cat output indents option names, while descriptions are further indented.
        const option = line.match(/^\s{4,12}([A-Z][A-Za-z0-9]+)\s*$/);
        if (section && option && lines[i + 1]?.match(/^\s{8,}/) && !known.has(`${section}.${option[1]}`)) {
            found.push({ section, key: option[1], type: "text", editable: false, help: "Read-only: cockpit.conf(5) did not establish this option's type or safety." });
        }
    }
    return found;
}

export function updateConfig(content, changes, schema = STATIC_SCHEMA) {
    const errors = validateChanges(changes, schema);
    if (Object.keys(errors).length) throw new Error(Object.entries(errors).map(([key, error]) => `${key}: ${error}`).join("; "));
    const source = String(content ?? ""), newline = source.includes("\r\n") ? "\r\n" : "\n";
    const hadFinalNewline = source.endsWith("\n"), lines = source ? source.split(/\r?\n/) : [];
    for (const item of schema.filter(item => item.editable)) {
        const raw = changes[id(item)]; if (raw === undefined) continue;
        const change = item.type === "boolean" ? normalizeBoolean(raw) : String(raw).trim();
        const parsed = parseConfig(lines.join("\n"));
        const matches = parsed.sections.filter(section => section.name.toLowerCase() === item.section.toLowerCase());
        if (matches.length > 1) throw new Error(`Duplicate managed section: [${item.section}]`);
        const section = matches[0], keys = section?.keys.filter(key => key.name.toLowerCase() === item.key.toLowerCase()) ?? [];
        if (keys.length > 1) throw new Error(`Duplicate managed directive: [${item.section}] ${item.key}`);
        if (keys[0]) lines[keys[0].line] = lines[keys[0].line].replace(/([ \t]*=[ \t]*|[ \t]*:[ \t]*|[ \t]+)[^#;]*?([ \t]+[#;].*)?$/, `$1${change}$2`);
        else if (section) lines.splice(section.line + 1, 0, `${item.key} = ${change}`);
        else { if (lines.length && lines.at(-1) !== "") lines.push(""); lines.push(`[${item.section}]`, `${item.key} = ${change}`); }
    }
    let result = lines.join(newline);
    if (source || hadFinalNewline || result) result = result.replace(/[\r\n]*$/, "") + (hadFinalNewline || !source ? newline : "");
    return result;
}
