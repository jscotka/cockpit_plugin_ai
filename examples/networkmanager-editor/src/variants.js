/* Pure helpers for Cockpit's JSON representation of D-Bus variants. */
export function unwrap(value) {
    if (value && typeof value === "object" && typeof value.t === "string" && Object.hasOwn(value, "v")) return unwrap(value.v);
    if (Array.isArray(value)) return value.map(unwrap);
    if (value && typeof value === "object" && !(value instanceof Uint8Array)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unwrap(item)]));
    return value;
}

export function variant(signature, value) { return globalThis.cockpit?.variant ? cockpit.variant(signature, value) : { t: signature, v: value }; }
export function infer(value) {
    if (typeof value === "boolean") return variant("b", value);
    if (typeof value === "number") return variant(Number.isInteger(value) ? "i" : "d", value);
    if (typeof value === "string") return variant("s", value);
    if (value instanceof Uint8Array) return variant("ay", value);
    if (Array.isArray(value)) return variant("as", value);
    if (value && typeof value === "object") return variant("a{sv}", Object.fromEntries(Object.entries(value).map(([key, item]) => [key, infer(item)])));
    return variant("s", "");
}

export function cloneSettings(settings) { return structuredClone(settings); }
export function preserveSecret(existing, section, key, entered) {
    // GetSettings deliberately omits secrets.  Leaving this key absent makes
    // Update2 preserve the daemon-side secret; never invent a fetched secret.
    const current = existing?.[section]?.[key];
    if (entered === undefined || entered === "") return current;
    return variant("s", entered);
}

export function setOrDelete(section, key, value) {
    if (value === undefined || value === null || value === "") delete section[key];
    else section[key] = infer(value);
}
