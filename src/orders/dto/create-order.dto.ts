import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  cartId: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  @MinLength(10)
  shippingAddress: string;

  @IsString()
  @MinLength(8)
  contactNumber: string;
}
