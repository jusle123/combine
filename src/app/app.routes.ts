import { Routes } from '@angular/router';
import {ItemFormComponent} from './items/item-form/item-form';
import {ItemsListComponent} from './items/items-list/items-list';
import {TagsComponent} from './tags/tags-component/tags-component';
import {MatchComponent} from './items/match-component/match-component';

export const routes: Routes = [
  // {path: '', component: AppComponent},
  {path: 'new-item', component: ItemFormComponent},
  {path: 'items', component: ItemsListComponent},
  {path: 'tags', component: TagsComponent},
  {path: 'match', component: MatchComponent},
  // {path: 'profile', component: AppComponent},
];
