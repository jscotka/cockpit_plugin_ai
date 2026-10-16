export const canSave = state => Boolean(state.domReady && state.loaded && state.file);

export const missingRequiredIds = (presentIds, requiredIds) => requiredIds.filter(id => !presentIds.has(id));

export const assetRevisionMatches = (htmlRevision, bundleRevision) => Boolean(htmlRevision && htmlRevision === bundleRevision);

export async function modifyAndRefresh(file, updater, refresh) {
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
