import {Category} from './category.enum';

export interface Item {
  id?: number;
  title: string;
  image?: any;
  tags?: Array<number>;
  createdAt: Date;
  category: number;
}

export interface DisplayItem extends Item {
  imageSrc?: string;
}
