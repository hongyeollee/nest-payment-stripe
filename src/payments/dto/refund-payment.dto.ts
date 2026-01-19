import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ example: 'ORD-1a2b3c4d' })
  @IsString()
  orderCode: string;

  @ApiPropertyOptional({ example: 10000, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
