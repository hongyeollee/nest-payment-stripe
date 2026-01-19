import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 255 })
  imageUrl: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ length: 20, default: 'KRW' })
  currency: string;
}
