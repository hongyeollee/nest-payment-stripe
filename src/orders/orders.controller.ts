import { Body, Controller, Get, Param, Post, Render, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartService } from '../cart/cart.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

const orderResponseExample = {
  orderCode: 'ORD-1a2b3c4d',
  customerName: 'Lee Hyori',
  customerEmail: 'lee@example.com',
  shippingAddress: 'Seoul street 1',
  contactNumber: '01012341234',
  totalAmount: 54000,
  currency: 'KRW',
  status: 'pending',
  stripePaymentIntentId: null,
  stripeChargeId: null,
  stripeReceiptUrl: null,
  items: [
    {
      id: 'item-uuid',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      productName: 'Cloud Mug Set',
      productImageUrl: '/assets/products/cloud-mug.jpg',
      unitPrice: 27000,
      quantity: 2,
      lineTotal: 54000,
    },
  ],
};

const orderBadRequestExample = {
  statusCode: 400,
  message: 'Cart is empty',
  error: 'Bad Request',
};

const orderNotFoundExample = {
  statusCode: 404,
  message: 'Order not found',
  error: 'Not Found',
};

@Controller('orders')
@ApiTags('Orders')
@ApiExtraModels(OrderResponseDto, ErrorResponseDto)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
  ) {}

  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiBody({ type: CreateOrderDto })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(OrderResponseDto) }],
      example: orderResponseExample,
    },
  })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: orderBadRequestExample },
  })
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
  @ApiOperation({ summary: '주문 상세 화면' })
  @ApiParam({ name: 'orderCode' })
  @ApiProduces('text/html')
  @ApiOkResponse({
    schema: {
      type: 'string',
      example: '<html><body>Order confirmation page</body></html>',
    },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: orderNotFoundExample },
  })
  async viewOrder(@Param('orderCode') orderCode: string) {
    const order = await this.ordersService.findByCode(orderCode);
    return { order };
  }
}
