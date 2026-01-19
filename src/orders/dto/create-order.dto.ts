import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'session-uuid' })
  @IsUUID()
  cartId: string;

  @ApiProperty({ example: 'Lee Hyori' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: 'lee@example.com' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ example: 'Seoul street 1' })
  @IsString()
  @MinLength(10)
  shippingAddress: string;

  @ApiProperty({ example: '01012341234' })
  @IsString()
  @MinLength(8)
  contactNumber: string;
}
