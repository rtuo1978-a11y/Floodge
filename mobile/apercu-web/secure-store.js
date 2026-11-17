export async function getItemAsync(k) { return globalThis.localStorage?.getItem(k) ?? null; }
export async function setItemAsync(k, v) { globalThis.localStorage?.setItem(k, v); }
export async function deleteItemAsync(k) { globalThis.localStorage?.removeItem(k); }
