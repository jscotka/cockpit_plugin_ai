import manifest from "./schema.json" with { type: "json" };

const supportedTypes = new Set(["boolean", "integer", "text", "structured"]);
const id = item => `${item.section}.${item.key}`;

export function validateSchema(candidate) {
    if (!candidate || !Number.isInteger(candidate.schemaRevision) || candidate.schemaRevision < 1)
        throw new Error("Schema revision must be a positive integer");
    if (!candidate.compatibility || typeof candidate.compatibility !== "string")
        throw new Error("Schema compatibility metadata is required");
    if (!candidate.source || typeof candidate.source !== "string")
        throw new Error("Schema source metadata is required");
    if (!Array.isArray(candidate.sections) || !candidate.sections.length)
        throw new Error("Schema must define at least one section");

    const sections = new Set(), options = new Set(), flattened = [];
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
            if (option.default !== undefined && ((option.type === "boolean" && typeof option.default !== "boolean") || (option.type === "integer" && (!Number.isSafeInteger(option.default) || option.default < option.min || option.default > option.max))))
                throw new Error(`Invalid schema default for ${optionId}`);
            flattened.push({ section: section.name, ...option });
        }
    }
    return flattened;
}

export const SCHEMA_METADATA = { revision: manifest.schemaRevision, compatibility: manifest.compatibility, source: manifest.source };
export const STATIC_SCHEMA = validateSchema(manifest);

const keyRE = /^[ \t]*([^#;\s][^=:\s]*?)\s*(?:=|:)\s*(.*?)\s*$/;
const bools = new Map([["true", "true"], ["yes", "true"], ["1", "true"], ["false", "false"], ["no", "false"], ["0", "false"]]);

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

export function valuesFor(content, schema = STATIC_SCHEMA) {
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

function validationError(item, raw) {
    const value = String(raw ?? "");
    const rule = item.validation;
    if (value.length > rule.maxLength) return `Use at most ${rule.maxLength} characters.`;
    if (/\r|\n|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return "Control characters and line breaks are not allowed.";
    if (!value && rule.allowEmpty) return null;
    if (!value) return "A value is required.";
    switch (rule.kind) {
    case "boolean": return normalizeBoolean(value) ? null : "Use true, false, yes, no, 1, or 0.";
    case "integer": return !/^[0-9]+$/.test(value.trim()) || !Number.isSafeInteger(Number(value)) || Number(value) < item.min || Number(value) > item.max ? `Enter a whole number from ${item.min} to ${item.max}.` : null;
    case "header": return /^[A-Za-z][A-Za-z0-9-]*$/.test(value) ? null : "Enter an HTTP header name.";
    case "token": return /^[A-Za-z][A-Za-z0-9_.-]*$/.test(value) ? null : "Enter a parameter name using letters, numbers, dots, hyphens, or underscores.";
    case "line": return /[;#]/.test(value) ? "The value cannot contain comment characters." : null;
    case "fatal-list": return /^(?:criticals|warnings)(?: +(criticals|warnings))*$/.test(value) ? null : "Use a space-separated list containing only criticals and warnings.";
    case "max-startups": {
        if (/^[0-9]+$/.test(value)) return Number(value) <= 4294967295 ? null : "Enter a number from 0 to 4294967295.";
        const parts = value.split(":");
        if (parts.length !== 3 || parts.some(part => !/^[0-9]+$/.test(part))) return "Use a number or start:rate:full.";
        const [start, rate, full] = parts.map(Number);
        return start <= 4294967295 && rate >= 1 && rate <= 100 && full <= 4294967295 && start <= full ? null : "Use start:rate:full with start ≤ full and rate from 1 to 100.";
    }
    case "url-root": return /^\/(?!cockpit(?:\/|\+|$))(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]*$/.test(value) ? null : "Enter a URL path other than reserved /cockpit or /cockpit+ forms.";
    case "relative-path": return /^(?!\/)(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/.test(value) ? null : "Enter a relative URL path.";
    case "absolute-path": return /^\/(?:[^\0\r\n/]+\/)*[^\0\r\n/]*$/.test(value) && !/[;#]/.test(value) ? null : "Enter an absolute filesystem path without comment characters.";
    case "origins": {
        const host = "(?:\\\\\[[0-9A-Fa-f:.%*?]+\\\\\]|[A-Za-z0-9*?._~-]+)";
        const origin = new RegExp(`^https?:\\/\\/${host}(?::[0-9]{1,5})?$`);
        return value.trim().split(/\s+/).every(candidate => origin.test(candidate)) ? null : "Use space-separated HTTP(S) origins with a host and optional port, without paths.";
    }
    case "https-url": try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? null : "Use an HTTP or HTTPS URL."; } catch { return "Enter a valid HTTP or HTTPS URL."; }
    default: return "This option has no recognized validator.";
    }
}

export function validateChanges(changes, schema = STATIC_SCHEMA) {
    const errors = {};
    for (const item of schema.filter(item => item.editable)) {
        const value = changes[id(item)];
        if (value === undefined) continue;
        const error = validationError(item, value);
        if (error) errors[id(item)] = error;
    }
    return errors;
}

export function parseRenderedMan(output, schema = STATIC_SCHEMA) {
    const knownSections = new Set(schema.map(item => item.section));
    const documented = new Set(), lines = String(output ?? "").split(/\r?\n/);
    let section = null, headings = 0;
    for (let i = 0; i < lines.length; i++) {
        const heading = lines[i].match(/^\s{0,3}([A-Za-z][A-Za-z0-9]*)\s*$/);
        if (heading && knownSections.has(heading[1])) { section = heading[1]; headings++; continue; }
        const option = lines[i].match(/^\s{4,12}([A-Z][A-Za-z0-9]+)\s*$/);
        if (section && option && lines[i + 1]?.match(/^\s{8,}/)) documented.add(`${section}.${option[1]}`);
    }
    const expected = new Set(schema.map(id));
    const missing = [...expected].filter(option => !documented.has(option));
    const extra = [...documented].filter(option => !expected.has(option));
    return { available: true, malformed: headings === 0, headings, documented: [...documented], missing, extra, mismatch: headings === 0 || missing.length > 0 || extra.length > 0 };
}

export function updateConfig(content, changes, schema = STATIC_SCHEMA) {
    const errors = validateChanges(changes, schema);
    if (Object.keys(errors).length) throw new Error(Object.entries(errors).map(([key, error]) => `${key}: ${error}`).join("; "));
    const source = String(content ?? ""), newline = source.includes("\r\n") ? "\r\n" : "\n";
    const hadFinalNewline = source.endsWith("\n"), lines = source ? source.split(/\r?\n/) : [];
    for (const item of schema.filter(item => item.editable)) {
        const raw = changes[id(item)]; if (raw === undefined) continue;
        const change = item.type === "boolean" ? normalizeBoolean(raw) : item.type === "integer" ? String(raw).trim() : String(raw);
        const parsed = parseConfig(lines.join("\n"));
        const matches = parsed.sections.filter(section => section.name.toLowerCase() === item.section.toLowerCase());
        if (matches.length > 1) throw new Error(`Duplicate managed section: [${item.section}]`);
        const section = matches[0], keys = section?.keys.filter(key => key.name.toLowerCase() === item.key.toLowerCase()) ?? [];
        if (keys.length > 1) throw new Error(`Duplicate managed directive: [${item.section}] ${item.key}`);
        if (keys[0] && change === "") {
            const comment = lines[keys[0].line].match(/[ \t]+([#;].*)$/);
            if (comment)
                lines[keys[0].line] = `${lines[keys[0].line].match(/^\s*/)[0]}${comment[1]}`;
            else
            lines.splice(keys[0].line, 1);
            const sectionStart = section.line;
            const sectionEnd = lines.findIndex((line, index) => index > sectionStart && /^\s*\[[^\]]+\]\s*(?:[#;].*)?$/.test(line));
            const end = sectionEnd < 0 ? lines.length : sectionEnd;
            if (section && lines.slice(sectionStart + 1, end).every(line => !line.trim()))
                lines.splice(sectionStart, end - sectionStart);
        } else if (keys[0]) lines[keys[0].line] = lines[keys[0].line].replace(/([ \t]*=[ \t]*|[ \t]*:[ \t]*|[ \t]+)[^#;]*?([ \t]+[#;].*)?$/, (_, prefix, comment = "") => `${prefix}${change}${comment}`);
        else if (change === "") continue;
        else if (section) lines.splice(section.line + 1, 0, `${item.key} = ${change}`);
        else { if (lines.length && lines.at(-1) !== "") lines.push(""); lines.push(`[${item.section}]`, `${item.key} = ${change}`); }
    }
    let result = lines.join(newline);
    if (result) result = result.replace(/[\r\n]*$/, "") + (hadFinalNewline || !source ? newline : "");
    return result;
}
