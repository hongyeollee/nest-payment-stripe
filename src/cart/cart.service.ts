import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async getOrCreate(sessionId?: string) {
    if (!sessionId) {
      return this.createCart();
    }

    const cart = await this.cartRepository.findOne({
      where: { sessionId },
      relations: ['items'],
    });

    return cart ?? this.createCart();
  }

  private async createCart() {
    const cart = this.cartRepository.create({
      sessionId: randomUUID(),
      items: [],
      totalAmount: 0,
      currency: 'KRW',
    });
    return this.cartRepository.save(cart);
  }

  async addItem(sessionId: string | undefined, productId: string, quantity = 1) {
    const cart = await this.getOrCreate(sessionId);
    const products = await this.productsService.findByIds([productId]);
    const product = products[0];

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = cart.items.find(
      (item) => item.product.id === product.id,
    );

    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = existing.quantity * existing.unitPrice;
      await this.cartItemRepository.save(existing);
    } else {
      const item = this.cartItemRepository.create({
        cart,
        product,
        quantity,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
      });
      cart.items.push(item);
      await this.cartItemRepository.save(item);
    }

    await this.recalculate(cart);

    return cart;
  }

  async updateQuantity(
    sessionId: string,
    itemId: string,
    quantity: number,
  ) {
    const cart = await this.cartRepository.findOne({
      where: { sessionId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    item.quantity = quantity;
    item.lineTotal = quantity * item.unitPrice;
    await this.cartItemRepository.save(item);
    await this.recalculate(cart);

    return cart;
  }

  async removeItem(sessionId: string, itemId: string) {
    const cart = await this.cartRepository.findOne({
      where: { sessionId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.cartItemRepository.remove(item);
    cart.items = cart.items.filter((entry) => entry.id !== itemId);
    await this.recalculate(cart);

    return cart;
  }

  async clearCart(sessionId: string) {
    const cart = await this.cartRepository.findOne({
      where: { sessionId },
      relations: ['items'],
    });

    if (!cart) {
      return;
    }

    await this.cartItemRepository.remove(cart.items);
    cart.items = [];
    cart.totalAmount = 0;
    await this.cartRepository.save(cart);
  }

  private async recalculate(cart: Cart) {
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    cart.totalAmount = totalAmount;
    await this.cartRepository.save(cart);
  }
}
