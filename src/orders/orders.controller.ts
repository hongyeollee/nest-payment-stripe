import { Body, Controller, Get, Param, Post, Render, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartService } from '../cart/cart.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
  ) {}

  @Post()
  async createOrder(@Body() body: CreateOrderDto, @Req() request: Request) {
    const order = await this.ordersService.createFromCart(body.cartId, {
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress,
      contactNumber: body.contactNumber,
    });

    await this.cartService.clearCart(body.cartId);
    if (request.session) {
      request.session.cartId = undefined;
    }

    return order;
  }

  @Get(':orderCode')
  @Render('shop/confirmation')
  async viewOrder(@Param('orderCode') orderCode: string) {
    const order = await this.ordersService.findByCode(orderCode);
    return { order };
  }
}
