import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';
import { PaymentsCoreModule } from '../payments-core/payments-core.module';

@Module({
  imports: [ProductsModule, CartModule, PaymentsCoreModule.forRootFromEnv()],
  controllers: [ShopController],
})
export class ShopModule {}
