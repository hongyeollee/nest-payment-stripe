import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

export enum PaymentStatus {
  Pending = 'pending',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Refunded = 'refunded',
  Cancelled = 'cancelled',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ length: 80 })
  orderCode: string;

  @Column({ length: 120 })
  paymentIntentId: string;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  chargeId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  receiptUrl: string | null;


  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;
}
