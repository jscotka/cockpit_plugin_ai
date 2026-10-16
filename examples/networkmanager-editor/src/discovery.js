import { CONNECTION, DEVICE, NM, NM_PATH, PROP, SETTINGS } from "./dbus-contracts.js";
import { unwrap } from "./variants.js";

export const EDITABLE_TYPES = new Set(["802-3-ethernet", "802-11-wireless"]);
const ACTIVE_CONNECTION = "org.freedesktop.NetworkManager.ActiveConnection";

async function property(call, path, iface, name) {
    const [value] = await call(path, PROP, "Get", [iface, name]);
    return value;
}

async function deviceInfo(call, path) {
    const [deviceType, activeConnection, iface] = await Promise.all([
        property(call, path, DEVICE, "DeviceType"),
        property(call, path, DEVICE, "ActiveConnection"),
        property(call, path, DEVICE, "Interface"),
    ]);
    let accessPoints = [];
    if (unwrap(deviceType) === 2) {
        try { accessPoints = (await property(call, path, "org.freedesktop.NetworkManager.Device.Wireless", "AccessPoints")) || []; } catch (error) { /* optional on older NetworkManager versions */ }
    }
    return { path, properties: { DeviceType: deviceType, ActiveConnection: activeConnection, Interface: iface }, accessPoints };
}

export async function discoverNetwork(call) {
    const [[devicePaths], [profilePaths]] = await Promise.all([
        call(NM_PATH, NM, "GetAllDevices"),
        call("/org/freedesktop/NetworkManager/Settings", SETTINGS, "ListConnections"),
    ]);
    const devices = await Promise.all((devicePaths || []).map(path => deviceInfo(call, path)));
    const accessPointPaths = [...new Set(devices.flatMap(device => device.accessPoints.map(path => unwrap(path))))];
    const aps = await Promise.all(accessPointPaths.map(async path => {
        const [ssid, strength, flags] = await Promise.all([
            property(call, path, "org.freedesktop.NetworkManager.AccessPoint", "Ssid"),
            property(call, path, "org.freedesktop.NetworkManager.AccessPoint", "Strength"),
            property(call, path, "org.freedesktop.NetworkManager.AccessPoint", "Flags"),
        ]);
        return { path, properties: { Ssid: unwrap(ssid), Strength: unwrap(strength), Flags: unwrap(flags) } };
    }));
    const profiles = await Promise.all((profilePaths || []).map(async path => {
        try {
            const [settings] = await call(path, CONNECTION, "GetSettings");
            const type = unwrap(settings?.connection?.type);
            return { path, settings, type, editable: EDITABLE_TYPES.has(type) };
        } catch (classificationError) {
            return { path, editable: false, classificationError };
        }
    }));
    const activePaths = [...new Set(devices.map(device => unwrap(device.properties.ActiveConnection)).filter(path => path && path !== "/"))];
    const activeConnections = new Map();
    await Promise.all(activePaths.map(async path => {
        const connection = await property(call, path, ACTIVE_CONNECTION, "Connection");
        activeConnections.set(path, unwrap(connection));
    }));
    return { devices, profiles, activeConnections, aps };
}

export function classifyObjects(objects = {}) {
    const profiles = [];
    const devices = [];
    const activeConnections = new Map();
    for (const [path, interfaces] of Object.entries(objects)) {
        if (interfaces[SETTINGS + ".Connection"]) {
            const settings = interfaces[SETTINGS + ".Connection"];
            const type = unwrap(settings.Type || settings.type);
            profiles.push({ path, settings, type, editable: EDITABLE_TYPES.has(type) });
        }
        if (interfaces[DEVICE]) devices.push({ path, properties: interfaces[DEVICE] });
        if (interfaces["org.freedesktop.NetworkManager.ActiveConnection"])
            activeConnections.set(path, unwrap(interfaces["org.freedesktop.NetworkManager.ActiveConnection"].Connection));
    }
    return { profiles, devices, activeConnections };
}

export function activeConnectionPath(device, activeConnections) {
    const active = unwrap(device.properties.ActiveConnection);
    return active && active !== "/" ? active : null;
}

export function activeProfilePath(device, activeConnections) {
    const active = activeConnectionPath(device, activeConnections);
    return active ? activeConnections.get(active) || null : null;
}

export function deviceTypeIsSupported(device) {
    const type = unwrap(device.properties.DeviceType);
    return [1, 2, "ethernet", "wifi"].includes(type);
}
