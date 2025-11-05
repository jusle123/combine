import {Injectable} from '@angular/core';
import {DatabaseService} from '../shared/database-service';
import {Item} from './item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemsService extends DatabaseService<Item> {
  private readonly STORE_NAME = 'items';

  async saveItem(payload: Item): Promise<number> {
    const record: Item = {...payload};
    if (payload.image) {
      try {
        record.image = await this.saveImage(payload.image);
      } catch (err) {
        console.error('Failed to save image:', err);
        // Optionally decide whether to continue without image
      }
    }
    if (payload.id) {
      record.id = payload.id;
      return this.update(this.STORE_NAME, record);
    }
    return this.add(this.STORE_NAME, record);
  }

  async updateItem(id: number, updates: Partial<Item>) {
    const db = await this.openDB(this.STORE_NAME);
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          return reject(new Error('Item not found'));
        }

        // Merge updates without touching blob
        const updated = { ...item, ...updates };
        store.put(updated);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  saveImage(file: File): Promise<{
    blob: Blob,
    name: string;
    type: string;
    created: Date;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: file.type });

        resolve({
          blob,
          name: file.name,
          type: file.type,
          created: new Date(),
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async getAllItems() {
    return super.getAll(this.STORE_NAME);
  }

  async getItemById(id: number) {
    return super.getById(this.STORE_NAME, id);
  }

  async deleteItem(id: number) {
    return super.delete(this.STORE_NAME, id);
  }

  // Helper: convert a data URL (base64) to a Blob
  private dataURLtoBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(parts[1]);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = binary.charCodeAt(i);
    }
    return new Blob([u8], { type: mime });
  }
}
