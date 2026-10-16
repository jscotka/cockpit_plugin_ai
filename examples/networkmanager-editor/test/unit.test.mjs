import test from "node:test";
import assert from "node:assert/strict";
import { unwrap, infer, preserveSecret, cloneSettings } from "../src/variants.js";
import { address, mac, mtu, psk, ssid, validate } from "../src/validators.js";
import { withCheckpoint } from "../src/checkpoint.js";
import { dbusCall, NM, NM_PATH, CONNECTION, DEVICE, INPUT_SIGNATURES } from "../src/dbus-contracts.js";
import { classifyObjects, activeConnectionPath, activeProfilePath, discoverNetwork } from "../src/discovery.js";
import { ipv4ToUint32, uint32ToIpv4, ipv6ToBytes, bytesToIpv6, ipv4AddressesFromSettings, ipv6AddressesFromSettings, dnsFromSettings, ipv4LegacyAddresses, addressData, dnsValues } from "../src/settings.js";
import { saveThenRefresh } from "../src/save-flow.js";

test("unwraps nested variants and preserves byte arrays", () => { const bytes = new Uint8Array([1, 2]); assert.deepEqual(unwrap({ t: "a{sv}", v: { answer: { t: "u", v: 4 }, bytes } }), { answer: 4, bytes }); assert.equal(infer(true).t, "b"); });

test("D-Bus call contracts omit type for no-input calls and use input signatures", async () => {
    const calls = [], client = { call: (...args) => { calls.push(args); return Promise.resolve([]); } };
    await dbusCall(client, NM_PATH, NM, "GetAllDevices");
    await dbusCall(client, "/org/freedesktop/NetworkManager/Settings", "org.freedesktop.NetworkManager.Settings", "ListConnections");
    await dbusCall(client, "/profile", CONNECTION, "GetSettings");
    await dbusCall(client, "/device", "org.freedesktop.DBus.Properties", "Get", [DEVICE, "DeviceType"]);
    for (const [method, type] of Object.entries(INPUT_SIGNATURES)) await dbusCall(client, NM_PATH, NM, method, method === "Get" ? ["iface", "Property"] : method === "Update2" || method === "AddConnection2" ? [{}, 0, {}] : method === "CheckpointCreate" ? [[], 1, 0] : ["/checkpoint/1"]);
    assert.equal(calls[0][4].type, undefined); assert.equal(calls[1][4].type, undefined); assert.equal(calls[2][4].type, undefined);
    assert.equal(calls[3][4].type, "ss");
    for (const [method, type] of Object.entries(INPUT_SIGNATURES)) assert.equal(calls.find(call => call[2] === method)[4].type, type);
});

test("Update2 and AddConnection2 use persistent uint32 flag without fake persist argument", () => { assert.equal(INPUT_SIGNATURES.Update2, "a{sa{sv}}ua{sv}"); assert.equal(INPUT_SIGNATURES.AddConnection2, "a{sa{sv}}ua{sv}"); });

test("device classification uses Device and active connection maps to profile", () => {
    const objects = {
        "/profile": { "org.freedesktop.NetworkManager.Settings.Connection": { Type: { t: "s", v: "802-3-ethernet" } } },
        "/device": { [DEVICE]: { DeviceType: { t: "u", v: 1 }, ActiveConnection: { t: "o", v: "/active" } }, "org.freedesktop.NetworkManager": {} },
        "/active": { "org.freedesktop.NetworkManager.ActiveConnection": { Connection: { t: "o", v: "/profile" } } },
    };
    const result = classifyObjects(objects); assert.equal(result.devices.length, 1); assert.equal(activeConnectionPath(result.devices[0], result.activeConnections), "/active"); assert.equal(activeProfilePath(result.devices[0], result.activeConnections), "/profile"); assert.equal(result.profiles[0].editable, true);
});

test("NetworkManager discovery uses supported manager and settings methods", async () => {
    const calls = [];
    const values = new Map([
        ["/device", { DeviceType: { t: "u", v: 1 }, ActiveConnection: { t: "o", v: "/active" }, Interface: { t: "s", v: "eth0" } }],
        ["/active", [{ t: "o", v: "/profile" }]],
    ]);
    const call = async (path, iface, method, args) => {
        calls.push({ path, iface, method, args });
        if (method === "GetAllDevices") return [["/device"]];
        if (method === "ListConnections") return [["/profile"]];
        if (method === "GetSettings") return [{ connection: { type: { t: "s", v: "802-3-ethernet" } } }];
        if (method === "Get") return [values.get(path)?.[args[1]] ?? values.get(path)?.[0]];
        throw new Error(`unexpected ${method}`);
    };
    const result = await discoverNetwork(call);
    assert.equal(result.devices[0].path, "/device");
    assert.equal(result.profiles[0].editable, true);
    assert.equal(result.activeConnections.get("/active"), "/profile");
    assert.deepEqual(calls.slice(0, 2).map(call => [call.iface, call.method]), [
        [NM, "GetAllDevices"],
        ["org.freedesktop.NetworkManager.Settings", "ListConnections"],
    ]);
    assert(!calls.some(call => call.method === "GetManagedObjects"));
});

test("checkpoint uses manager CheckpointCreate/Rollback/Destroy and waits for confirmation", async () => {
    const calls = [], client = { call: async (path, iface, method, args, options) => { calls.push({ path, iface, method, args, options }); if (method === "CheckpointCreate") return ["/checkpoint/1"]; return []; } };
    await withCheckpoint(client, NM_PATH, async () => {}, { devices: ["/device"], confirm: async () => true });
    assert.deepEqual(calls.map(call => call.method), ["CheckpointCreate", "CheckpointDestroy"]); assert.deepEqual(calls[0].args, [["/device"], 30, 0]); assert.equal(calls[0].options.type, "aouu");
    calls.length = 0; await assert.rejects(withCheckpoint(client, NM_PATH, async () => { throw new Error("activation"); }, { confirm: async () => true }), /activation/); assert.deepEqual(calls.map(call => call.method), ["CheckpointCreate", "CheckpointRollback", "CheckpointDestroy"]); assert.equal(calls[1].options.type, "o");
});

test("IPv4 and IPv6 addresses, gateways, and DNS round-trip documented byte forms", () => {
    assert.equal(uint32ToIpv4(ipv4ToUint32("192.0.2.10")), "192.0.2.10"); assert.equal(bytesToIpv6(ipv6ToBytes("2001:db8::10")), "2001:db8::10");
    const v4 = { addresses: ipv4LegacyAddresses(["192.0.2.10/24"]), gateway: infer("192.0.2.1"), dns: dnsValues("ipv4", ["192.0.2.53"]) }; assert.deepEqual(ipv4AddressesFromSettings(v4), ["192.0.2.10/24"]); assert.deepEqual(dnsFromSettings("ipv4", v4), ["192.0.2.53"]);
    const v6 = { "address-data": addressData(["2001:db8::10/64"]), gateway: infer("2001:db8::1"), dns: dnsValues("ipv6", ["2001:4860:4860::8888"]) }; assert.deepEqual(ipv6AddressesFromSettings(v6), ["2001:db8::10/64"]); assert.deepEqual(dnsFromSettings("ipv6", v6), ["2001:4860:4860::8888"]);
});

test("blank PSK keeps secret omitted and entered PSK replaces it", () => { const omitted = { "802-11-wireless-security": { "key-mgmt": infer("wpa-psk") } }; assert.equal(preserveSecret(omitted, "802-11-wireless-security", "psk", ""), undefined); assert.equal(preserveSecret(omitted, "802-11-wireless-security", "psk", "newsecret").v, "newsecret"); assert.deepEqual(cloneSettings(omitted), omitted); assert(psk("a".repeat(63))); assert(psk("a".repeat(64))); assert(!psk("g".repeat(64))); });

test("unsupported profile types are not editable", () => { const result = classifyObjects({ "/bond": { "org.freedesktop.NetworkManager.Settings.Connection": { Type: { t: "s", v: "bond" } } } }); assert.equal(result.profiles[0].editable, false); });
test("validators reject malformed values", () => { assert(address("192.0.2.1/24")); assert(!address("192.0.2.1/33")); assert(mac("52:54:00:12:34:56")); assert(!mac("52:54:00:12:34:5g")); assert(mtu("1500")); assert(!mtu("100")); assert(ssid("wifi")); assert(!ssid("x".repeat(33))); const errors = validate({ id: "", mtu: "100", mac: "bad", ssid: "", psk: "short", ipv4: ["bad"], ipv6: [] }); assert.deepEqual(Object.keys(errors).sort(), ["id", "ipv4", "mac", "mtu", "psk"].sort()); });
test("save success is distinct from refresh failure", async () => { let saved = false; const result = await saveThenRefresh(async () => { saved = true; }, async () => { throw new Error("stale object path"); }); assert(saved); assert.equal(result.saved, true); assert.match(result.refreshError.message, /stale/); });
