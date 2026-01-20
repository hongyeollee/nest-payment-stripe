import { Controller, Get, Render, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { PaymentsCoreService } from '../payments-core/payments-core.service';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cartService: CartService,
    private readonly paymentsCoreService: PaymentsCoreService,
  ) {}

  @Get()
  @Render('shop/index')
  async viewShop(@Req() request: Request) {
    const cart = await this.cartService.getOrCreate(request.session?.cartId);
    if (request.session) {
      request.session.cartId = cart.sessionId;
    }

    const products = await this.productsService.findAll();

    return {
      products,
      cart,
      stripePublishableKey: this.paymentsCoreService.getPublishableKey(),
    };
  }
}
