import { Test } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

const createRequest = (session: Record<string, any> = {}) => ({
  session,
});

describe('CartController', () => {
  let controller: CartController;
  let cartService: {
    getOrCreate: jest.Mock;
    addItem: jest.Mock;
    removeItem: jest.Mock;
    updateQuantity: jest.Mock;
  };

  beforeEach(async () => {
    cartService = {
      getOrCreate: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compile();

    controller = moduleRef.get(CartController);
  });

  it('stores cart session on view', async () => {
    cartService.getOrCreate.mockResolvedValue({ sessionId: 'session-1' });

    const request = createRequest();
    const cart = await controller.viewCart(request as any);

    expect(request.session.cartId).toBe('session-1');
    expect(cartService.getOrCreate).toHaveBeenCalled();
    expect(cart.sessionId).toBe('session-1');
  });

  it('adds item and updates cart session', async () => {
    cartService.addItem.mockResolvedValue({ sessionId: 'session-2' });

    const request = createRequest({ cartId: 'session-1' });
    await controller.addToCart(
      { productId: 'product-1', quantity: 2 },
      request as any,
    );

    expect(cartService.addItem).toHaveBeenCalledWith(
      'session-1',
      'product-1',
      2,
    );
    expect(request.session.cartId).toBe('session-2');
  });

  it('skips remove when no session', async () => {
    const request = createRequest();
    await controller.removeItem('item-1', request as any);

    expect(cartService.removeItem).not.toHaveBeenCalled();
  });

  it('updates quantity when session exists', async () => {
    const request = createRequest({ cartId: 'session-1' });
    await controller.updateQuantity('item-1', 3, request as any);

    expect(cartService.updateQuantity).toHaveBeenCalledWith(
      'session-1',
      'item-1',
      3,
    );
  });
});
