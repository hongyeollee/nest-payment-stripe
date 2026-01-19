import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

const cartResponseExample = {
  sessionId: 'session-uuid',
  totalAmount: 56000,
  currency: 'KRW',
  items: [
    {
      id: 'item-uuid',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      product: {
        id: 'product-uuid',
        createdAt: '2026-01-19T12:00:00.000Z',
        updatedAt: '2026-01-19T12:00:00.000Z',
        name: 'Cloud Mug Set',
        description: 'Soft matte mugs with cloud glaze finish.',
        imageUrl: '/assets/products/cloud-mug.jpg',
        price: 28000,
        currency: 'KRW',
      },
      quantity: 2,
      unitPrice: 28000,
      lineTotal: 56000,
    },
  ],
};

const notFoundExample = {
  statusCode: 404,
  message: 'Resource not found',
  error: 'Not Found',
};

const badRequestExample = {
  statusCode: 400,
  message: 'Validation failed',
  error: 'Bad Request',
};

@Controller('cart')
@ApiTags('Cart')
@ApiExtraModels(CartResponseDto, ErrorResponseDto)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '장바구니 조회' })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CartResponseDto) }],
      example: cartResponseExample,
    },
  })
  async viewCart(@Req() request: Request) {
    const cart = await this.cartService.getOrCreate(request.session?.cartId);
    request.session.cartId = cart.sessionId;
    return cart;
  }

  @Post('add')
  @Redirect('/shop', 302)
  @ApiOperation({ summary: '장바구니 담기' })
  @ApiBody({ type: AddToCartDto })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CartResponseDto) }],
      example: cartResponseExample,
    },
  })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: badRequestExample },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: notFoundExample },
  })
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
  @ApiOperation({ summary: '장바구니 항목 삭제' })
  @ApiBody({ schema: { properties: { itemId: { type: 'string' } } } })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CartResponseDto) }],
      example: cartResponseExample,
    },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: notFoundExample },
  })
  async removeItem(@Body('itemId') itemId: string, @Req() request: Request) {
    if (request.session?.cartId) {
      await this.cartService.removeItem(request.session.cartId, itemId);
    }
    return;
  }

  @Post('update')
  @Redirect('/shop', 302)
  @ApiOperation({ summary: '장바구니 수량 수정' })
  @ApiBody({ schema: { properties: { itemId: { type: 'string' }, quantity: { type: 'number' } } } })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CartResponseDto) }],
      example: cartResponseExample,
    },
  })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: badRequestExample },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: notFoundExample },
  })
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
