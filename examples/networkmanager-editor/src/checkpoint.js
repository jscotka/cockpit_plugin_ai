import { NM, inputSignature } from "./dbus-contracts.js";

const _ = globalThis.cockpit?.gettext || (value => value);

const waitFor = (promise, timeout) => {
    let timer;
    const expiry = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(_("NetworkManager checkpoint timed out."))), timeout); });
    return Promise.race([promise, expiry]).finally(() => clearTimeout(timer));
};

export async function withCheckpoint(client, managerPath, operation, { timeout = 30000, devices = [], confirm = async () => true } = {}) {
    const call = (method, args) => client.call(managerPath, NM, method, args, { type: inputSignature(method), timeout });
    const [checkpoint] = await waitFor(call("CheckpointCreate", [devices, Math.ceil(timeout / 1000), 0]), timeout);
    let confirmed = false, rolledBack = false;
    try {
        await waitFor(operation(), timeout);
        try {
            confirmed = await waitFor(confirm(), timeout);
        } catch (error) {
            error.confirmationTimeout = true;
        }
        if (!confirmed) {
            const error = new Error(_("NetworkManager did not confirm activation before the checkpoint timed out."));
            try { await call("CheckpointRollback", [checkpoint]); rolledBack = true; } catch (rollbackError) { error.rollbackError = rollbackError; }
            throw error;
        }
    } catch (error) {
        if (confirmed) throw error;
        if (!rolledBack && !error.rollbackError) {
            try { await call("CheckpointRollback", [checkpoint]); rolledBack = true; } catch (rollbackError) { error.rollbackError = rollbackError; }
        }
        throw error;
    } finally {
        // Destroy only after observed success or after rollback following a
        // failed/expired confirmation; never immediately after ActivateConnection.
        await call("CheckpointDestroy", [checkpoint]).catch(() => {});
    }
    return checkpoint;
}
