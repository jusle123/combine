import { Injectable } from '@angular/core';
import {DatabaseService} from '../shared/database-service';
import {Tag} from './tag.model';

@Injectable({
  providedIn: 'root'
})
export class TagsService extends DatabaseService<Tag> {
  private readonly STORE_NAME = 'tags';

  async addTag(record: Tag): Promise<number> {
    return this.add(this.STORE_NAME, record);
  }

  async getAllTags() {
    return super.getAll(this.STORE_NAME);
  }

  async getTagById(id: number) {
    return super.getById(this.STORE_NAME, id);
  }

  async deleteTag(id: number) {
    return super.delete(this.STORE_NAME, id);
  }
}
