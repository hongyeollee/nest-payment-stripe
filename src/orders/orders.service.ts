import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly cartService: CartService,
  ) {}

  async createFromCart(
    cartId: string,
    payload: Omit<
      Order,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'items'
      | 'totalAmount'
      | 'currency'
      | 'status'
      | 'orderCode'
      | 'stripePaymentIntentId'
      | 'stripeChargeId'
      | 'stripeReceiptUrl'
    >,
  ) {
    const cart = await this.cartService.getOrCreate(cartId);

    if (!cart.items.length) {
      throw new NotFoundException('Cart is empty');
    }

    const order = this.ordersRepository.create({
      ...payload,
      orderCode: `ORD-${randomUUID().slice(0, 8)}`,
      totalAmount: cart.totalAmount,
      currency: cart.currency,
      status: OrderStatus.Pending,
      items: cart.items.map((item) =>
        this.orderItemsRepository.create({
          productName: item.product.name,
          productImageUrl: item.product.imageUrl,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        }),
      ),
    });

    return this.ordersRepository.save(order);
  }

  findByCode(orderCode: string) {
    return this.ordersRepository.findOne({
      where: { orderCode },
      relations: ['items'],
    });
  }

  async updatePaymentInfo(
    orderCode: string,
    updates: Partial<
      Pick<
        Order,
        'stripePaymentIntentId' | 'stripeChargeId' | 'stripeReceiptUrl' | 'status'
      >
    >,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { orderCode },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    Object.assign(order, updates);
    return this.ordersRepository.save(order);
  }

  async markRefunded(orderCode: string, receiptUrl: string | null) {
    return this.updatePaymentInfo(orderCode, {
      status: OrderStatus.Refunded,
      stripeReceiptUrl: receiptUrl,
    });
  }

  async markPaid(
    orderCode: string,
    paymentIntentId: string,
    chargeId: string | null,
    receiptUrl: string | null,
  ) {
    return this.updatePaymentInfo(orderCode, {
      status: OrderStatus.Paid,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      stripeReceiptUrl: receiptUrl,
    });
  }

  async markCancelled(orderCode: string) {
    return this.updatePaymentInfo(orderCode, {
      status: OrderStatus.Cancelled,
    });
  }
}
