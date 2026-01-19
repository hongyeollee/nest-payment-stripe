import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: '7a28b150-6784-4b7a-9d44-3ef7b39b8f8d' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}
