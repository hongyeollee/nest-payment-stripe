import { Test } from '@nestjs/testing';
import { ShopController } from './shop.controller';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { PaymentsCoreService } from '../payments-core/payments-core.service';

const createRequest = (session: Record<string, any> = {}) => ({
  session,
});

describe('ShopController', () => {
  let controller: ShopController;
  let productsService: { findAll: jest.Mock };
  let cartService: { getOrCreate: jest.Mock };

  beforeEach(async () => {
    productsService = { findAll: jest.fn() };
    cartService = { getOrCreate: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [ShopController],
      providers: [
        { provide: ProductsService, useValue: productsService },
        { provide: CartService, useValue: cartService },
        {
          provide: PaymentsCoreService,
          useValue: { getPublishableKey: jest.fn().mockReturnValue('pk_test') },
        },
      ],
    }).compile();

    controller = moduleRef.get(ShopController);
  });

  it('returns product list and assigns session cart', async () => {
    cartService.getOrCreate.mockResolvedValue({ sessionId: 'session-1' });
    productsService.findAll.mockResolvedValue([{ id: 'product-1' }]);

    const request = createRequest();
    const result = await controller.viewShop(request as any);

    expect(request.session.cartId).toBe('session-1');
    expect(result.products).toHaveLength(1);
  });
});
