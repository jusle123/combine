import {Component, effect, inject, OnDestroy, signal} from '@angular/core';
import {ItemFormComponent} from '../item-form/item-form';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {ItemsService} from '../items-service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {Item} from '../item.model';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';

@Component({
  selector: 'app-items-list',
  imports: [
    DatePipe,
    ItemFormComponent,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatIconButton,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle
  ],
  templateUrl: './items-list.html',
  styleUrl: './items-list.scss'
})
export class ItemsListComponent implements OnDestroy {
  private itemsService = inject(ItemsService);
  items: Array<{ data: Item; imageUrl?: string }> = [];
  page = 1;
  pageSize = 6;
  total = 0;
  pageSizeOptions = [6, 12, 24];
  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();
  selectedItemId = signal<number | null>(null);

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page = 1;
      this.load();
    });
    effect(() => {
      if (!this.selectedItemId()) {
        this.load();
        console.log('Reloaded items due to selected item change.');
      }
    });
    this.load();
  }

  async load() {
    const search = this.searchControl.value || '';
    const res = await this.itemsService.getAllItems();
    // revoke previous urls
    this.items.forEach(i => { if (i.imageUrl) URL.revokeObjectURL(i.imageUrl); });
    this.items = res.map(it => {
      if (it.image) {
        const blob = new Blob([it.image.blob], { type: it.image.type }); // 👈 set MIME type
        const imageUrl = URL.createObjectURL(blob);
        return { data: it, imageUrl };
      }
      return { data: it };
    });
    this.total = res.length;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.items.forEach(i => { if (i.imageUrl) URL.revokeObjectURL(i.imageUrl); });
  }

  async onSaved() {
    this.page = 1;
    await this.load();
  }

  async prev() {
    if (this.page > 1) {
      this.page--;
      await this.load();
    }
  }
  async next() {
    if (this.page * this.pageSize < this.total) {
      this.page++;
      await this.load();
    }
  }
  async setPageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    await this.load();
  }

  async deleteItem(id: number) {
    await this.itemsService.deleteItem(id);
    this.page = 1;
    await this.load();
  }

  protected readonly Math = Math;
}
