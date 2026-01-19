import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ length: 120 })
  productName: string;

  @Column({ length: 255 })
  productImageUrl: string;

  @Column({ type: 'int' })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  lineTotal: number;
}
