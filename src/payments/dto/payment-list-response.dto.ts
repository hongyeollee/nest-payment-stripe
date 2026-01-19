import { ApiProperty } from '@nestjs/swagger';
import { PaymentResponseDto } from './payment-response.dto';

export class PaymentListResponseDto {
  @ApiProperty({ type: () => PaymentResponseDto, isArray: true })
  items: PaymentResponseDto[];
}
