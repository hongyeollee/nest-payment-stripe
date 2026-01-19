import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async viewCart(@Req() request: Request) {
    const cart = await this.cartService.getOrCreate(request.session?.cartId);
    request.session.cartId = cart.sessionId;
    return cart;
  }

  @Post('add')
  @Redirect('/shop', 302)
  async addToCart(@Body() body: AddToCartDto, @Req() request: Request) {
    const cart = await this.cartService.addItem(
      request.session?.cartId,
      body.productId,
      body.quantity,
    );
    request.session.cartId = cart.sessionId;
    return;
  }

  @Post('remove')
  @Redirect('/shop', 302)
  async removeItem(@Body('itemId') itemId: string, @Req() request: Request) {
    if (request.session?.cartId) {
      await this.cartService.removeItem(request.session.cartId, itemId);
    }
    return;
  }

  @Post('update')
  @Redirect('/shop', 302)
  async updateQuantity(
    @Body('itemId') itemId: string,
    @Body('quantity') quantity: number,
    @Req() request: Request,
  ) {
    if (request.session?.cartId) {
      await this.cartService.updateQuantity(
        request.session.cartId,
        itemId,
        Number(quantity),
      );
    }
    return;
  }
}
