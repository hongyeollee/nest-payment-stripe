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
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OrderCodeDto } from './dto/order-code.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getPayments(@Query('orderCode') orderCode?: string) {
    return this.paymentsService.findPayments(orderCode);
  }

  @Post('intent')
  async createIntent(@Body() body: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(body.orderCode);
  }

  @Post('refund')
  @HttpCode(303)
  async refund(@Body() body: RefundPaymentDto, @Res() response: Response) {
    await this.paymentsService.refund(body.orderCode, body.amount);
    return response.redirect(`/orders/${body.orderCode}`);
  }

  @Post('cancel')
  @HttpCode(303)
  async cancel(@Body() body: OrderCodeDto, @Res() response: Response) {
    await this.paymentsService.cancelPayment(body.orderCode);
    return response.redirect(`/orders/${body.orderCode}`);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() request: Request,
    @Res() response: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-12-15.clover',
    });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? '',
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
