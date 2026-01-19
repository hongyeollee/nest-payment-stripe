import { Test } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartService } from '../cart/cart.service';

const createRequest = (session: Record<string, any> = {}) => ({
  session,
});

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: { createFromCart: jest.Mock; findByCode: jest.Mock };
  let cartService: { clearCart: jest.Mock };

  beforeEach(async () => {
    ordersService = {
      createFromCart: jest.fn(),
      findByCode: jest.fn(),
    };
    cartService = { clearCart: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
        { provide: CartService, useValue: cartService },
      ],
    }).compile();

    controller = moduleRef.get(OrdersController);
  });

  it('creates order and clears cart session', async () => {
    ordersService.createFromCart.mockResolvedValue({ orderCode: 'ORD-1' });

    const request = createRequest({ cartId: 'session-1' });
    const order = await controller.createOrder(
      {
        cartId: 'session-1',
        customerName: 'Lee',
        customerEmail: 'lee@example.com',
        shippingAddress: 'Seoul street 1',
        contactNumber: '01012341234',
      },
      request as any,
    );

    expect(cartService.clearCart).toHaveBeenCalledWith('session-1');
    expect(request.session.cartId).toBeUndefined();
    expect(order.orderCode).toBe('ORD-1');
  });

  it('returns order view data', async () => {
    ordersService.findByCode.mockResolvedValue({ orderCode: 'ORD-2' });

    const result = await controller.viewOrder('ORD-2');

    expect(result.order.orderCode).toBe('ORD-2');
  });
});
