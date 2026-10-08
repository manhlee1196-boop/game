// ===== Lưu trữ IndexedDB (chế độ web) — không cần thư viện ngoài =====
const DB_NAME = 'kho-hang-data';
const DB_VERSION = 1;
const STORE = 'kv';
const KEY = 'sqlite-data';

export function idbAvailable(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Không mở được IndexedDB'));
  });
}

export async function idbGet(key: string): Promise<Uint8Array | null> {
  const d = await openDb();
  try {
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = d.transaction(STORE, 'readonly');
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => resolve((rq.result as Uint8Array) ?? null);
      rq.onerror = () => reject(rq.error ?? new Error('IDB get lỗi'));
    });
  } finally {
    d.close();
  }
}

export async function idbSet(key: string, value: Uint8Array): Promise<void> {
  const d = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IDB set lỗi'));
      tx.onabort = () => reject(tx.error ?? new Error('IDB set bị abort'));
    });
  } finally {
    d.close();
  }
}
