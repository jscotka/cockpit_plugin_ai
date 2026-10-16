export const NM = "org.freedesktop.NetworkManager";
export const NM_PATH = "/org/freedesktop/NetworkManager";
export const PROP = "org.freedesktop.DBus.Properties";
export const SETTINGS = "org.freedesktop.NetworkManager.Settings";
export const CONNECTION = "org.freedesktop.NetworkManager.Settings.Connection";
export const DEVICE = "org.freedesktop.NetworkManager.Device";

export const INPUT_SIGNATURES = Object.freeze({
    Get: "ss",
    CheckpointCreate: "aouu",
    CheckpointRollback: "o",
    CheckpointDestroy: "o",
    ActivateConnection: "ooo",
    DeactivateConnection: "o",
    Update2: "a{sa{sv}}ua{sv}",
    AddConnection2: "a{sa{sv}}ua{sv}",
});

export const NO_INPUT_SIGNATURE = undefined;

export function inputSignature(method) {
    return INPUT_SIGNATURES[method];
}

export function dbusCall(client, path, iface, method, args = [], timeout = 15000) {
    const type = inputSignature(method);
    return client.call(path, iface, method, args, type === undefined ? { timeout } : { type, timeout });
}
