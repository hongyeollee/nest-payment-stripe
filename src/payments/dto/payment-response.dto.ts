import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../payment.entity';

export class PaymentResponseDto {
  @ApiProperty({ example: 'ORD-1a2b3c4d' })
  orderCode: string;

  @ApiProperty({ example: 'pi_123' })
  paymentIntentId: string;

  @ApiProperty({ example: 'ch_123', nullable: true })
  chargeId: string | null;

  @ApiProperty({ example: 54000 })
  amount: number;

  @ApiProperty({ example: 'KRW' })
  currency: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.Pending })
  status: PaymentStatus;

  @ApiProperty({ example: 'https://receipt', nullable: true })
  receiptUrl: string | null;
}
