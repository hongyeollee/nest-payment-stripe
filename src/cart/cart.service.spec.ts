import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { ProductsService } from '../products/products.service';

const createRepositoryMock = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('CartService', () => {
  let service: CartService;
  let cartRepository: ReturnType<typeof createRepositoryMock>;
  let cartItemRepository: ReturnType<typeof createRepositoryMock>;
  let productsService: { findByIds: jest.Mock };

  beforeEach(async () => {
    cartRepository = createRepositoryMock();
    cartItemRepository = createRepositoryMock();
    productsService = { findByIds: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: cartRepository },
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    service = moduleRef.get(CartService);
  });

  it('creates a cart when none exists', async () => {
    const createdCart = {
      sessionId: 'session-1',
      items: [],
      totalAmount: 0,
      currency: 'KRW',
    } as Cart;

    cartRepository.create.mockReturnValue(createdCart);
    cartRepository.save.mockResolvedValue(createdCart);

    const result = await service.getOrCreate();

    expect(cartRepository.create).toHaveBeenCalled();
    expect(result).toEqual(createdCart);
  });

  it('adds a new item and recalculates total', async () => {
    const product = {
      id: 'product-1',
      name: 'Sample',
      price: 12000,
    } as any;
    const cart = {
      sessionId: 'session-1',
      items: [],
      totalAmount: 0,
      currency: 'KRW',
    } as Cart;

    cartRepository.findOne.mockResolvedValue(cart);
    cartRepository.save.mockResolvedValue(cart);
    cartItemRepository.create.mockImplementation((value) => value);
    cartItemRepository.save.mockImplementation((value) => value);
    productsService.findByIds.mockResolvedValue([product]);

    const result = await service.addItem('session-1', product.id, 2);

    expect(cartItemRepository.save).toHaveBeenCalled();
    expect(result.totalAmount).toBe(24000);
  });

  it('increments quantity when item already exists', async () => {
    const product = {
      id: 'product-1',
      name: 'Sample',
      price: 12000,
    } as any;
    const existingItem = {
      id: 'item-1',
      product,
      quantity: 1,
      unitPrice: 12000,
      lineTotal: 12000,
    } as CartItem;
    const cart = {
      sessionId: 'session-1',
      items: [existingItem],
      totalAmount: 12000,
      currency: 'KRW',
    } as Cart;

    cartRepository.findOne.mockResolvedValue(cart);
    cartRepository.save.mockResolvedValue(cart);
    cartItemRepository.save.mockImplementation((value) => value);
    productsService.findByIds.mockResolvedValue([product]);

    const result = await service.addItem('session-1', product.id, 2);

    expect(existingItem.quantity).toBe(3);
    expect(result.totalAmount).toBe(36000);
  });

  it('throws when product is missing', async () => {
    cartRepository.findOne.mockResolvedValue({
      sessionId: 'session-1',
      items: [],
      totalAmount: 0,
      currency: 'KRW',
    });
    productsService.findByIds.mockResolvedValue([]);

    await expect(
      service.addItem('session-1', 'missing', 1),
    ).rejects.toThrow('Product not found');
  });

  it('updates quantity for existing item', async () => {
    const item = {
      id: 'item-1',
      unitPrice: 10000,
      quantity: 1,
      lineTotal: 10000,
    } as CartItem;
    const cart = {
      sessionId: 'session-1',
      items: [item],
      totalAmount: 10000,
    } as Cart;

    cartRepository.findOne.mockResolvedValue(cart);
    cartRepository.save.mockResolvedValue(cart);
    cartItemRepository.save.mockImplementation((value) => value);

    const result = await service.updateQuantity('session-1', 'item-1', 3);

    expect(item.lineTotal).toBe(30000);
    expect(result.totalAmount).toBe(30000);
  });

  it('throws when cart missing on update', async () => {
    cartRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateQuantity('session-1', 'item-1', 2),
    ).rejects.toThrow('Cart not found');
  });

  it('throws when item missing on update', async () => {
    cartRepository.findOne.mockResolvedValue({
      sessionId: 'session-1',
      items: [],
    });

    await expect(
      service.updateQuantity('session-1', 'item-1', 2),
    ).rejects.toThrow('Item not found');
  });

  it('throws when cart missing on remove', async () => {
    cartRepository.findOne.mockResolvedValue(null);

    await expect(
      service.removeItem('session-1', 'item-1'),
    ).rejects.toThrow('Cart not found');
  });

  it('throws when item missing on remove', async () => {
    cartRepository.findOne.mockResolvedValue({
      sessionId: 'session-1',
      items: [],
    });

    await expect(
      service.removeItem('session-1', 'item-1'),
    ).rejects.toThrow('Item not found');
  });

  it('removes item and recalculates', async () => {
    const item = {
      id: 'item-1',
      unitPrice: 10000,
      quantity: 1,
      lineTotal: 10000,
    } as CartItem;
    const cart = {
      sessionId: 'session-1',
      items: [item],
      totalAmount: 10000,
    } as Cart;

    cartRepository.findOne.mockResolvedValue(cart);
    cartRepository.save.mockResolvedValue(cart);
    cartItemRepository.remove.mockResolvedValue(item);

    const result = await service.removeItem('session-1', 'item-1');

    expect(result.items).toHaveLength(0);
    expect(result.totalAmount).toBe(0);
  });

  it('clears cart items', async () => {
    const item = { id: 'item-1' } as CartItem;
    const cart = {
      sessionId: 'session-1',
      items: [item],
      totalAmount: 10000,
    } as Cart;

    cartRepository.findOne.mockResolvedValue(cart);
    cartRepository.save.mockResolvedValue(cart);
    cartItemRepository.remove.mockResolvedValue([item]);

    await service.clearCart('session-1');

    expect(cart.items).toHaveLength(0);
    expect(cart.totalAmount).toBe(0);
  });
});
