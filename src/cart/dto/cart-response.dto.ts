import { ApiProperty } from '@nestjs/swagger';
import { CartItem } from '../cart-item.entity';

export class CartResponseDto {
  @ApiProperty({ example: 'session-uuid' })
  sessionId: string;

  @ApiProperty({ example: 54000 })
  totalAmount: number;

  @ApiProperty({ example: 'KRW' })
  currency: string;

  @ApiProperty({ type: () => CartItem, isArray: true })
  items: CartItem[];
}
