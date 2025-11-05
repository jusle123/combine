// src/app/items/match-component/match-component.component.ts
import {Component, effect, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {DisplayItem, Item} from '../item.model';
import { ItemsService } from '../items-service';
import {Category} from '../category.enum';
import {TagsService} from '../../tags/tags-service';
import {Tag} from '../../tags/tag.model';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DisplayItemComponent} from '../display-item/display-item';

@Component({
  selector: 'app-match-component',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, DisplayItemComponent],
  templateUrl: './match-component.html',
  styleUrl: './match-component.scss'
})
export class MatchComponent implements OnInit {
  itemsService: ItemsService = inject(ItemsService);
  tagsService: TagsService = inject(TagsService);
  jewelleryItems: DisplayItem[] = [];
  dressItems: DisplayItem[] = [];
  topItems: DisplayItem[] = [];
  bottomItems: DisplayItem[] = [];
  shoesItems: DisplayItem[] = [];

  selectedJewellery: number[] = [];
  selectedDress: number | null = null;
  selectedTop: number | null = null;
  selectedBottom: number | null = null;
  selectedShoes: number | null = null;

  tags: Tag[] = [];
  selectedTags = signal<number[]>([]);

  constructor() {
    effect(() => {
      const tags = this.selectedTags(); // track here synchronously
      this.loadItems(tags);
    });
  }

  ngOnInit(): void {
    // this.loadItems();
    this.loadTags();
  }

  private async loadItems(selectedTags: number[]): Promise<void> {
    try {
      const all = (await this.itemsService.getAllItems()) as DisplayItem[] | undefined;
      if (selectedTags.length > 0) {
        // filter items by selected tags
        const filtered = all?.filter(it => {
          if (!it.tags || it.tags.length === 0) return true;
          return selectedTags.every(tagId => it.tags!.includes(tagId));
        });
        all?.splice(0, all.length, ...(filtered || []));
      }
      this.clearItems();
      if (Array.isArray(all) && all.length > 0) {
        // categorize by tags if present, otherwise ignore
        all.forEach(it => {
          it.imageSrc = this.buildImageSrc(it.image);
          const category = Number(it.category);
          switch (category) {
            case Category.JEWELLERY:
              this.jewelleryItems.push(it);
              break;
            case Category.ALL:
              this.dressItems.push(it);
              break;
            case Category.TOP:
              this.topItems.push(it);
              break;
            case Category.BOTTOM:
              this.bottomItems.push(it);
              break;
            case Category.SHOES:
              this.shoesItems.push(it);
              break;
            default:
              break;
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  private clearItems(): void {
    this.jewelleryItems = [];
    this.dressItems = [];
    this.topItems = [];
    this.bottomItems = [];
    this.shoesItems = [];
  }

  private loadTags(): void {
    this.tagsService.getAllTags().then(tags => {
      this.tags = tags;
    }).catch(err => {
      console.error('Error loading tags:', err);
    });
  }

  toggleTagSelection(tagId: number): void {
    const tags = this.selectedTags();
    const idx = tags.indexOf(tagId);
    if (idx > -1) {
      this.selectedTags.set(tags.filter(t => t !== tagId));
    } else {
      this.selectedTags.set([...tags, tagId]);
    }
  }

  private buildImageSrc(img: any): string | undefined {
    if (typeof img === 'string') return img;
    if (img instanceof Blob) return URL.createObjectURL(img);
    if (img.blob instanceof Blob) return URL.createObjectURL(img.blob);
    return undefined;
  }

  private findById(list: DisplayItem[], id: number | null): Item | null {
    if (id == null) return null;
    return list.find(i => i.id === id) ?? null;
  }

  get selectedJewelleryItems(): DisplayItem[] {
    return this.jewelleryItems.filter(i => this.selectedJewellery.includes(i.id ?? -1));
  }

  get selectedDressItem(): DisplayItem | null { return this.findById(this.dressItems, this.selectedDress); }
  get selectedTopItem(): DisplayItem | null { return this.findById(this.topItems, this.selectedTop); }
  get selectedBottomItem(): DisplayItem | null { return this.findById(this.bottomItems, this.selectedBottom); }
  get selectedShoesItem(): DisplayItem | null { return this.findById(this.shoesItems, this.selectedShoes); }

  // getImageSrc(it: Item | null): string | null {
  //   if (!it || it.image == null) return null;
  //   const img = it.image as any;
  //   // possible shapes: string path, Blob, or object { blob, name, type, created }
  //   if (typeof img === 'string') return img;
  //   if (img instanceof Blob) return URL.createObjectURL(img);
  //   if (img.blob instanceof Blob) return URL.createObjectURL(img.blob);
  //   return null;
  // }

  protected deleteItemFromMultiple(items: number[], itemId: number): void {
    const idx = items.indexOf(itemId);
    if (idx > -1) {
      items.splice(idx, 1);
    }
  }
}
