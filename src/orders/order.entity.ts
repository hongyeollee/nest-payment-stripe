import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ length: 80, unique: true })
  orderCode: string;

  @Column({ length: 80 })
  customerName: string;

  @Column({ length: 120 })
  customerEmail: string;

  @Column({ length: 120 })
  shippingAddress: string;

  @Column({ length: 30 })
  contactNumber: string;

  @Column({ type: 'int', default: 0 })
  totalAmount: number;

  @Column({ length: 20, default: 'KRW' })
  currency: string;

  @Column({ length: 40, default: OrderStatus.Pending })
  status: OrderStatus;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  stripePaymentIntentId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  stripeChargeId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  stripeReceiptUrl: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];
}
