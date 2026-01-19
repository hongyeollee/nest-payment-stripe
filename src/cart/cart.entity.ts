import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart extends BaseEntity {
  @ApiProperty({ example: 'session-uuid' })
  @Column({ length: 80, unique: true })
  sessionId: string;

  @ApiProperty({ type: () => CartItem, isArray: true })
  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @ApiProperty({ example: 54000 })
  @Column({ type: 'int', default: 0 })
  totalAmount: number;

  @ApiProperty({ example: 'KRW' })
  @Column({ length: 20, default: 'KRW' })
  currency: string;
}
