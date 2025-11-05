import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService<T = any> {
  protected dbPromise: Promise<IDBDatabase> | null = null;
  private readonly DB_NAME = 'combine-db';
  private readonly DB_VERSION = 3;
  private readonly STORES= ['items', 'tags'];

  protected openDB(storeName: string): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of this.STORES) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => console.warn('IndexedDB open blocked');
    });

    return this.dbPromise;
  }

  protected async add(storeName: string, record: T) {
    const db = await this.openDB(storeName);
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.add(record);
      req.onsuccess = () => resolve(Number(req.result));
      req.onerror = () => reject(req.error);
    });
  }

  protected async update(storeName: string, record: T) {
    const db = await this.openDB(storeName);
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve(Number(req.result));
      req.onerror = () => reject(req.error);
    });
  }

  protected async getAll(storeName: string): Promise<T[]> {
    const db = await this.openDB(storeName);
    return new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  protected async getById(storeName: string, id: number): Promise<T | undefined> {
    const db = await this.openDB(storeName);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  protected async delete(storeName: string, id: number): Promise<void> {
    const db = await this.openDB(storeName);
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
