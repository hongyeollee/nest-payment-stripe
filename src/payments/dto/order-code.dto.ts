import { IsString } from 'class-validator';

export class OrderCodeDto {
  @IsString()
  orderCode: string;
}
