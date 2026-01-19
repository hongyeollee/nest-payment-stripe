import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from '../order-item.entity';
import { OrderStatus } from '../order.entity';

export class OrderResponseDto {
  @ApiProperty({ example: 'ORD-1a2b3c4d' })
  orderCode: string;

  @ApiProperty({ example: 'Lee Hyori' })
  customerName: string;

  @ApiProperty({ example: 'lee@example.com' })
  customerEmail: string;

  @ApiProperty({ example: 'Seoul street 1' })
  shippingAddress: string;

  @ApiProperty({ example: '01012341234' })
  contactNumber: string;

  @ApiProperty({ example: 54000 })
  totalAmount: number;

  @ApiProperty({ example: 'KRW' })
  currency: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.Pending })
  status: OrderStatus;

  @ApiProperty({ example: 'pi_123', nullable: true })
  stripePaymentIntentId: string | null;

  @ApiProperty({ example: 'ch_123', nullable: true })
  stripeChargeId: string | null;

  @ApiProperty({ example: 'https://receipt', nullable: true })
  stripeReceiptUrl: string | null;

  @ApiProperty({ type: () => OrderItem, isArray: true })
  items: OrderItem[];
}
