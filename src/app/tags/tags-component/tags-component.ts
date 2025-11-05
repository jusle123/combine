import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TagsService} from '../tags-service';
import {Tag} from '../tag.model';

@Component({
  selector: 'app-tags-component',
  imports: [
    FormsModule
  ],
  templateUrl: './tags-component.html',
  styleUrl: './tags-component.scss'
})
export class TagsComponent {
  private tagsService = inject(TagsService);
  protected tags = signal<Tag[]>([]);
  newTag = '';

  constructor() {
    this.loadTags();
  }

  async loadTags() {
    const data = await this.tagsService.getAllTags();
    this.tags.set(data);
  }

  addTag(): void {
    const value = this.newTag.trim();
    if (!value) { return; }
    const newTag = {text: value} as Tag;
    if (this.tags().includes(newTag)) { return; }
    this.tagsService.addTag(newTag).then((id) => {
      newTag.id = id;
      this.tags.update(tags => [...tags, newTag]);
      this.newTag = '';
    });
  }

  removeTag(id: number, index: number): void {
    this.tagsService.deleteTag(id).then(() => {
      this.tags.update(tags => tags.filter((_, i) => i !== index));
    })
  }
}
