import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'ORD-1a2b3c4d' })
  @Column({ length: 80 })
  orderCode: string;

  @ApiProperty({ example: 'pi_123' })
  @Column({ length: 120 })
  paymentIntentId: string;

  @ApiProperty({ example: 'ch_123', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 120 })
  chargeId: string | null;

  @ApiProperty({ example: 'https://receipt', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 120 })
  receiptUrl: string | null;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.Pending })
  @Column({ length: 40, default: PaymentStatus.Pending })
  status: PaymentStatus;

  @ApiProperty({ example: 54000 })
  @Column({ type: 'int' })
  amount: number;

  @ApiProperty({ example: 'KRW' })
  @Column({ length: 20, default: 'KRW' })
  currency: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;
}
