import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';

export class PaymentIntentResponseDto {
  @ApiProperty({ example: 'pi_client_secret_123' })
  clientSecret: string | null;

  @ApiProperty({ type: () => OrderResponseDto })
  order: OrderResponseDto;
}
