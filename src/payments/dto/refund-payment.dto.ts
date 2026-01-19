import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  orderCode: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
