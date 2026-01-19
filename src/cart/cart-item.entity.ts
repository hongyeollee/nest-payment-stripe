import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Product } from '../products/product.entity';
import { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @ApiProperty({ type: () => Cart })
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ example: 28000 })
  @Column({ type: 'int' })
  unitPrice: number;

  @ApiProperty({ example: 28000 })
  @Column({ type: 'int' })
  lineTotal: number;
}
