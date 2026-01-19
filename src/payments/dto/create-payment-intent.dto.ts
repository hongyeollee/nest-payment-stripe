import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'ORD-1a2b3c4d' })
  @IsString()
  orderCode: string;
}
