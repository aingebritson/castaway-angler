import { parseSave, type SaveEnvelope } from '../state/save';

type LoadResult = { kind: 'empty' } | { kind: 'loaded' | 'recovered'; save: SaveEnvelope } | { kind: 'blocked' | 'unavailable'; message: string };
export class SaveStore {
  private database: Promise<IDBDatabase> | undefined;
  private tail: Promise<unknown> = Promise.resolve();
  failNext = false;
  constructor(readonly name: string) {}
  private open(): Promise<IDBDatabase> {
    if (!this.database) this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('slots');
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); this.database = undefined; };
        resolve(request.result);
      };
      request.onerror = () => { this.database = undefined; reject(request.error); };
      request.onblocked = () => reject(new Error('Close another copy of the game, then try again.'));
    });
    return this.database;
  }
  async load(): Promise<LoadResult> {
    try {
      const db = await this.open();
      const values = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction('slots', 'readonly'), slots = tx.objectStore('slots');
        const current = slots.get('current'), previous = slots.get('previous');
        tx.oncomplete = () => resolve([current.result, previous.result]);
        tx.onerror = () => reject(tx.error);
      });
      if (values.every(v => v === undefined)) return { kind: 'empty' };
      for (let i = 0; i < values.length; i++) {
        try { return { kind: i === 0 ? 'loaded' : 'recovered', save: parseSave(values[i]) }; } catch { /* Try the untouched recovery generation. */ }
      }
      return { kind: 'blocked', message: 'Neither local save could be read. Your stored data is preserved. Import a backup or explicitly begin a new game.' };
    } catch {
      return { kind: 'unavailable', message: 'Local storage is unavailable. You can play and export a save, but this session cannot be saved on this device yet.' };
    }
  }
  save(input: SaveEnvelope, preserveImportBackup = false): Promise<void> {
    const snapshot = structuredClone(parseSave(input));
    const task = this.tail.catch(() => {}).then(async () => {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('slots', 'readwrite'), slots = tx.objectStore('slots');
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('Save interrupted'));
        const old = slots.get('current');
        old.onsuccess = () => {
          let valid: SaveEnvelope | undefined;
          try { valid = parseSave(old.result); } catch { /* Never overwrite a valid backup with corrupt data. */ }
          if (valid) { slots.put(valid, 'previous'); if (preserveImportBackup) slots.put(valid, 'pre-import'); }
          else if (preserveImportBackup) {
            const recovery = slots.get('previous');
            recovery.onsuccess = () => { try { slots.put(parseSave(recovery.result), 'pre-import'); } catch { /* No valid old generation. */ } };
          }
          slots.put(snapshot, 'current');
          if (this.failNext) { this.failNext = false; tx.abort(); }
        };
      });
    });
    this.tail = task;
    return task;
  }
  async flush() { await this.tail; }
  async getImportBackup(): Promise<SaveEnvelope | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('slots').objectStore('slots').get('pre-import');
      request.onsuccess = () => { try { resolve(parseSave(request.result)); } catch { resolve(null); } };
      request.onerror = () => reject(request.error);
    });
  }
  async close() { (await this.database)?.close(); this.database = undefined; }
}

