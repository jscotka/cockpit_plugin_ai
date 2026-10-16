export async function saveThenRefresh(save, refresh) {
    await save();
    try {
        await refresh();
        return { saved: true, refreshError: null };
    } catch (refreshError) {
        return { saved: true, refreshError };
    }
}
