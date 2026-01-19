import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [ProductsModule, CartModule],
  controllers: [ShopController],
})
export class ShopModule {}
