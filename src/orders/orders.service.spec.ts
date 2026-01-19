import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartService } from '../cart/cart.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: ReturnType<typeof createRepositoryMock>;
  let orderItemsRepository: ReturnType<typeof createRepositoryMock>;
  let cartService: { getOrCreate: jest.Mock };

  beforeEach(async () => {
    ordersRepository = createRepositoryMock();
    orderItemsRepository = createRepositoryMock();
    cartService = { getOrCreate: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: ordersRepository },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemsRepository },
        { provide: CartService, useValue: cartService },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('throws when cart is empty', async () => {
    cartService.getOrCreate.mockResolvedValue({ items: [] });

    await expect(
      service.createFromCart('cart-1', {
        customerName: 'Lee',
        customerEmail: 'lee@example.com',
        shippingAddress: 'Seoul street 1',
        contactNumber: '01012341234',
      }),
    ).rejects.toThrow('Cart is empty');
  });

  it('creates order from cart', async () => {
    cartService.getOrCreate.mockResolvedValue({
      totalAmount: 30000,
      currency: 'KRW',
      items: [
        {
          product: { name: 'Item', imageUrl: '/img' },
          unitPrice: 15000,
          quantity: 2,
          lineTotal: 30000,
        },
      ],
    });

    ordersRepository.create.mockImplementation((value) => value);
    ordersRepository.save.mockImplementation((value) => value);
    orderItemsRepository.create.mockImplementation((value) => value);

    const order = await service.createFromCart('cart-1', {
      customerName: 'Lee',
      customerEmail: 'lee@example.com',
      shippingAddress: 'Seoul street 1',
      contactNumber: '01012341234',
    });

    expect(order.totalAmount).toBe(30000);
    expect(order.items).toHaveLength(1);
  });

  it('updates payment info for existing order', async () => {
    const order = { orderCode: 'ORD-1', items: [] } as Order;

    ordersRepository.findOne.mockResolvedValue(order);
    ordersRepository.save.mockImplementation((value) => value);

    const result = await service.updatePaymentInfo('ORD-1', {
      stripePaymentIntentId: 'pi_1',
    });

    expect(result.stripePaymentIntentId).toBe('pi_1');
  });

  it('marks order cancelled', async () => {
    const order = { orderCode: 'ORD-1', items: [] } as Order;

    ordersRepository.findOne.mockResolvedValue(order);
    ordersRepository.save.mockImplementation((value) => value);

    const result = await service.markCancelled('ORD-1');

    expect(result.status).toBe('cancelled');
  });
});
