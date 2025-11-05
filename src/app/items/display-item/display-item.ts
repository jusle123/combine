import {Component, input, OnInit, output, signal} from '@angular/core';
import {MatIconButton} from "@angular/material/button";
import {Item} from '../item.model';
import {MatIconModule} from '@angular/material/icon';

export interface DisplayItem extends Item {
  imageSrc?: string;
}

@Component({
  selector: 'app-display-item',
    imports: [
        MatIconButton,
      MatIconModule,
    ],
  templateUrl: './display-item.html',
  styleUrl: './display-item.scss',
})
export class DisplayItemComponent {
  item = input.required<DisplayItem>();
  deleteEvent = output<void>();

  onDelete() {
    this.deleteEvent.emit();
  }
}
