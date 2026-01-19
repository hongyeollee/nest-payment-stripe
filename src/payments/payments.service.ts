import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from './payment.entity';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly ordersService: OrdersService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createPaymentIntent(orderCode: string) {
    const order = await this.ordersService.findByCode(orderCode);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: order.totalAmount,
      currency: order.currency.toLowerCase(),
      metadata: {
        orderCode: order.orderCode,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const payment = this.paymentsRepository.create({
      orderCode: order.orderCode,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: PaymentStatus.Pending,
      metadata: paymentIntent.metadata,
    });

    await this.paymentsRepository.save(payment);
    await this.ordersService.updatePaymentInfo(order.orderCode, {
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      order,
    };
  }

  async confirmPaymentFromWebhook(paymentIntentId: string) {
    const payment = await this.paymentsRepository.findOne({
      where: { paymentIntentId },
    });
    if (!payment) {
      return null;
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ['latest_charge'] },
    );

    const latestCharge = paymentIntent.latest_charge as Stripe.Charge | null;
    const receiptUrl = latestCharge?.receipt_url ?? null;

    payment.status = PaymentStatus.Succeeded;
    payment.chargeId = latestCharge?.id ?? null;
    payment.receiptUrl = receiptUrl;
    await this.paymentsRepository.save(payment);

    await this.ordersService.markPaid(
      payment.orderCode,
      paymentIntent.id,
      latestCharge?.id ?? null,
      receiptUrl,
    );

    return payment;
  }

  async cancelPayment(orderCode: string) {
    const order = await this.ordersService.findByCode(orderCode);
    if (!order || !order.stripePaymentIntentId) {
      throw new NotFoundException('Payment not found');
    }

    await this.stripe.paymentIntents.cancel(order.stripePaymentIntentId);
    await this.ordersService.markCancelled(orderCode);

    const payment = await this.paymentsRepository.findOne({
      where: { paymentIntentId: order.stripePaymentIntentId },
    });
    if (payment) {
      payment.status = PaymentStatus.Cancelled;
      await this.paymentsRepository.save(payment);
    }

    return payment;
  }

  async refund(orderCode: string, amount?: number) {
    const order = await this.ordersService.findByCode(orderCode);
    if (!order || !order.stripePaymentIntentId) {
      throw new NotFoundException('Payment not found');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { paymentIntentId: order.stripePaymentIntentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: amount ?? undefined,
    });

    payment.status = PaymentStatus.Refunded;
    await this.paymentsRepository.save(payment);

    await this.ordersService.markRefunded(orderCode, payment.receiptUrl);

    return refund;
  }

  async findPayments(orderCode?: string) {
    if (orderCode) {
      return this.paymentsRepository.find({ where: { orderCode } });
    }

    return this.paymentsRepository.find({ order: { createdAt: 'DESC' } });
  }
}
