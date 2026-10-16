import { unwrap, variant } from "./variants.js";

const _ = globalThis.cockpit?.gettext || (value => value);

function bytes(value) {
    if (value instanceof Uint8Array) return value;
    if (Array.isArray(value)) return new Uint8Array(value);
    return new Uint8Array();
}

export function ipv4ToUint32(address) {
    return address.split(".").reduce((value, octet) => (value * 256) + Number(octet), 0) >>> 0;
}

export function uint32ToIpv4(value) {
    const number = Number(value) >>> 0;
    return [number >>> 24, (number >>> 16) & 255, (number >>> 8) & 255, number & 255].join(".");
}

export function ipv6ToBytes(address) {
    const halves = address.split("::");
    const left = halves[0] ? halves[0].split(":") : [];
    const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
    const groups = halves.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : address.split(":");
    if (groups.length !== 8) throw new Error(_("Invalid IPv6 address"));
    const output = new Uint8Array(16);
    groups.forEach((group, index) => { const number = parseInt(group || "0", 16); output[index * 2] = number >> 8; output[index * 2 + 1] = number & 255; });
    return output;
}

export function bytesToIpv6(value) {
    const octets = bytes(value);
    if (octets.length !== 16) return "";
    const groups = [];
    for (let index = 0; index < 16; index += 2) groups.push(((octets[index] << 8) | octets[index + 1]).toString(16));
    let bestStart = -1, bestLength = 0;
    for (let start = 0; start < 8;) {
        if (groups[start] !== "0") { start++; continue; }
        let end = start; while (end < 8 && groups[end] === "0") end++;
        if (end - start > bestLength) { bestStart = start; bestLength = end - start; }
        start = end;
    }
    if (bestLength < 2) return groups.join(":");
    return `${groups.slice(0, bestStart).join(":")}::${groups.slice(bestStart + bestLength).join(":")}`;
}

export function ipv4AddressesFromSettings(section = {}) {
    return (unwrap(section.addresses) || []).map(address => Array.isArray(address) ? `${uint32ToIpv4(address[0])}/${address[1]}` : address);
}

export function ipv6AddressesFromSettings(section = {}) {
    const modern = unwrap(section["address-data"]);
    if (Array.isArray(modern)) return modern.map(item => `${item.address || item.Address}/${item.prefix || item.Prefix}`);
    return (unwrap(section.addresses) || []).map(address => `${bytesToIpv6(address[0])}/${address[1]}`);
}

export function dnsFromSettings(family, section = {}) {
    const value = unwrap(section.dns) || [];
    return family === "ipv6" ? value.map(bytesToIpv6) : value.map(uint32ToIpv4);
}

export function addressData(addresses) {
    return variant("aa{sv}", addresses.map(value => { const [address, prefix] = value.split("/"); return { address: variant("s", address), prefix: variant("u", Number(prefix)) }; }));
}

export function ipv4LegacyAddresses(addresses) {
    return variant("aau", addresses.map(value => { const [address, prefix] = value.split("/"); return [ipv4ToUint32(address), Number(prefix), 0]; }));
}

export function dnsValues(family, values) {
    return variant(family === "ipv6" ? "aay" : "au", values.map(value => family === "ipv6" ? ipv6ToBytes(value) : ipv4ToUint32(value)));
}

export function readGateway(section = {}) { return unwrap(section.gateway) || ""; }
