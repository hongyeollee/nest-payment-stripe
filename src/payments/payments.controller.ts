import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OrderCodeDto } from './dto/order-code.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaymentsCoreService } from '../payments-core/payments-core.service';

const paymentResponseExample = {
  orderCode: 'ORD-1a2b3c4d',
  paymentIntentId: 'pi_123',
  chargeId: 'ch_123',
  amount: 54000,
  currency: 'KRW',
  status: 'pending',
  receiptUrl: null,
};

const paymentIntentResponseExample = {
  clientSecret: 'pi_client_secret_123',
  order: {
    orderCode: 'ORD-1a2b3c4d',
    customerName: 'Lee Hyori',
    customerEmail: 'lee@example.com',
    shippingAddress: 'Seoul street 1',
    contactNumber: '01012341234',
    totalAmount: 54000,
    currency: 'KRW',
    status: 'pending',
    stripePaymentIntentId: 'pi_123',
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
  },
};

const paymentNotFoundExample = {
  statusCode: 404,
  message: 'Payment not found',
  error: 'Not Found',
};

const paymentBadRequestExample = {
  statusCode: 400,
  message: 'Invalid payment state',
  error: 'Bad Request',
};

@Controller('payments')
@ApiTags('Payments')
@ApiExtraModels(PaymentResponseDto, PaymentIntentResponseDto, ErrorResponseDto)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentsCoreService: PaymentsCoreService,
  ) {}

  @Get()
  @ApiOperation({ summary: '결제 목록 조회' })
  @ApiQuery({ name: 'orderCode', required: false })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(PaymentResponseDto) },
      example: [paymentResponseExample],
    },
  })
  async getPayments(@Query('orderCode') orderCode?: string) {
    return this.paymentsService.findPayments(orderCode);
  }

  @Post('intent')
  @ApiOperation({ summary: 'Stripe 결제 Intent 생성' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(PaymentIntentResponseDto) }],
      example: paymentIntentResponseExample,
    },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: paymentNotFoundExample },
  })
  async createIntent(@Body() body: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(body.orderCode);
  }

  @Post('refund')
  @HttpCode(303)
  @ApiOperation({ summary: '결제 환불' })
  @ApiBody({ type: RefundPaymentDto })
  @ApiOkResponse({
    schema: {
      example: { statusCode: 303, message: 'Redirect to order detail' },
    },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: paymentNotFoundExample },
  })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: paymentBadRequestExample },
  })
  async refund(@Body() body: RefundPaymentDto, @Res() response: Response) {
    await this.paymentsService.refund(body.orderCode, body.amount);
    return response.redirect(`/orders/${body.orderCode}`);
  }

  @Post('cancel')
  @HttpCode(303)
  @ApiOperation({ summary: '결제 취소' })
  @ApiBody({ type: OrderCodeDto })
  @ApiOkResponse({
    schema: {
      example: { statusCode: 303, message: 'Redirect to order detail' },
    },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: paymentNotFoundExample },
  })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ErrorResponseDto), example: paymentBadRequestExample },
  })
  async cancel(@Body() body: OrderCodeDto, @Res() response: Response) {
    await this.paymentsService.cancelPayment(body.orderCode);
    return response.redirect(`/orders/${body.orderCode}`);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe 웹훅 수신' })
  @ApiOkResponse({ schema: { example: { received: true } } })
  @ApiBadRequestResponse({
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
      example: {
        statusCode: 400,
        message: 'Webhook Error: Invalid signature',
        error: 'Bad Request',
      },
    },
  })
  async handleWebhook(
    @Req() request: Request,
    @Res() response: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = this.paymentsCoreService.getStripeClient();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        this.paymentsCoreService.getWebhookSecret(),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return response.status(400).send(`Webhook Error: ${message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.paymentsService.confirmPaymentFromWebhook(paymentIntent.id);
    }

    return response.json({ received: true });
  }
}
