export const ipv4 = value => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split(".").every(part => Number(part) <= 255);
export const ipv6 = value => /^[0-9a-f:]+$/i.test(value) && value.includes(":") && value.length <= 39;
export const prefix = value => /^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 128;
export const address = value => { const [host, bits] = value.split("/"); return Boolean(bits && ((ipv4(host) && Number(bits) <= 32) || (ipv6(host) && prefix(bits)))); };
export const mtu = value => value === "" || (/^\d+$/.test(value) && Number(value) >= 576 && Number(value) <= 65536);
export const mac = value => value === "" || /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(value);
export const ssid = value => new TextEncoder().encode(value).length <= 32 && !/[\u0000]/.test(value);
export const psk = value => value === "" || ((value.length >= 8 && value.length <= 63 && !/[\u0000]/.test(value)) || /^[0-9a-f]{64}$/i.test(value));
const _ = globalThis.cockpit?.gettext || (value => value);
export function validate(values) {
    const errors = {};
    if (!values.id.trim() || values.id.length > 255) errors.id = _("Enter a connection name (up to 255 characters).");
    if (!mtu(values.mtu)) errors.mtu = _("MTU must be between 576 and 65536.");
    if (!mac(values.mac)) errors.mac = _("Enter a MAC address in hexadecimal form.");
    if (values.ssid !== undefined && !ssid(values.ssid)) errors.ssid = _("SSID must be at most 32 bytes and contain no NUL.");
    if (!psk(values.psk)) errors.psk = _("A PSK must be 8–63 characters or a 64-character hexadecimal key.");
    for (const family of ["ipv4", "ipv6"]) { const valuesForFamily = values[family] || []; if (valuesForFamily.some(item => !address(item))) errors[family] = _("Use address/prefix notation with a valid address."); }
    return errors;
}
