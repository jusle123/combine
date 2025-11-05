// File: `src/app/items/item-form/item-form.component.ts`
import {Component, effect, ElementRef, inject, input, model, OnInit, output, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ItemsService} from '../items-service';
import {Item} from '../item.model';
import {Tag} from '../../tags/tag.model';
import {TagsService} from '../../tags/tags-service';
import {useDebouncedSignal} from '../../shared/utils/debounce-signal';
import {Category} from '../category.enum';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconButton,
    MatIconModule, MatIconButton],
  templateUrl: './item-form.html',
  styleUrls: ['./item-form.scss']
})
export class ItemFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private itemsService = inject(ItemsService);
  private tagsService = inject(TagsService);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  itemId = model<number | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    image: [null],
    tags: [[]],
    category: [null, Validators.required]
  });

  imagePreview: string | ArrayBuffer | null = null;
  fileError: string | null = null;
  existingFile = signal<File | null>(null);

  readonly maxFileSize = 5 * 1024 * 1024; // 5 MB
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

  protected tags = signal<Tag[]>([]);
  tagSet = signal<Set<number>>(new Set());
  debouncedTagSet = useDebouncedSignal(this.tagSet, 300, new Set<number>());

  constructor() {
    effect(() => {
      const debounced = this.debouncedTagSet();
      this.form.patchValue(
        {tags: Array.from(debounced)},
        {emitEvent: false} // avoid circular updates
      );
    });
    effect(() => {
      const id = this.itemId();
      if (id) {
        this.loadItem(id);
      } else {
        this.form.get('image')!.addValidators(Validators.required);
      }
    });
  }

  async ngOnInit() {
    this.loadTags();
  }

  toggleTag(tagId: number) {
    const current = new Set(this.tagSet());
    current.has(tagId) ? current.delete(tagId) : current.add(tagId);
    this.tagSet.set(current);
  }

  isTagSelected(tagId: number): boolean {
    return this.tagSet().has(tagId);
  }

  loadTags() {
    this.tagsService.getAllTags().then((data) => {
      this.tags.set(data);
    });
  }

  loadItem(id: number) {
    this.itemsService.getItemById(id).then((item) => {
      if (item) {
        this.form.patchValue({
          title: item.title,
          tags: item.tags,
          category: item.category,
          image: item.image
        });
        if (item.image) {
          const file = new File([item.image.blob], item.image.name, { type: item.image.type });
          this.imagePreview = URL.createObjectURL(file);
          this.existingFile.set(file);
        }
      }
    });
  }

  onFileChange(event: Event) {
    this.fileError = null;
    this.imagePreview = null;
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.form.patchValue({image: null});
      this.form.get('image')?.updateValueAndValidity();
      return;
    }
    this.existingFile.set(null);
    const file = input.files[0];

    if (!this.allowedTypes.includes(file.type)) {
      this.fileError = 'Invalid file type. Only PNG and JPEG allowed.';
      this.form.patchValue({image: null});
      this.form.get('image')?.setErrors({invalidType: true});
      return;
    }

    if (file.size > this.maxFileSize) {
      this.fileError = 'File is too large. Max 5 MB.';
      this.form.patchValue({image: null});
      this.form.get('image')?.setErrors({maxSize: true});
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);

    this.form.patchValue({image: file});
    this.form.get('image')?.updateValueAndValidity();
  }

  clearForm() {
    this.form.reset();
    this.clearFile();
    this.itemId.set(null);
  }

  clearFile() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.imagePreview = null;
    this.existingFile.set(null);
    this.fileError = null;
    this.form.patchValue({image: null});
    this.form.get('image')?.setErrors({required: true});
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const file: File = this.form.get('image')!.value;
    const title = this.form.get('title')!.value;
    const tags = this.form.get('tags')!.value as Array<number>;
    const category = this.form.get('category')!.value as number;

    const item = {
      title: title,
      createdAt: new Date(),
      tags: tags,
      category: category
    } as Item;
    if (this.existingFile()) {
      this.itemsService.updateItem(this.itemId()!, item).then(this.clearForm.bind(this)).catch(err => {
        console.error('Error adding item:', err);
      });
    } else {
      if (this.itemId()) {
        item.id = this.itemId()!;
      }
      item.image = file;
      this.itemsService.saveItem(item).then(this.clearForm.bind(this)).catch(err => {
        console.error('Error adding item:', err);
      });
    }
  }

  protected deleteImage(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.existingFile.set(null);
    this.imagePreview = null;
    this.form.get('image')!.addValidators(Validators.required);
  }

  protected readonly Category = Category;
}
