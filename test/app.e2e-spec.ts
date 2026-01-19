import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CartModule } from '../src/cart/cart.module';
import { OrdersModule } from '../src/orders/orders.module';
import { PaymentsModule } from '../src/payments/payments.module';
import { ProductsModule } from '../src/products/products.module';
import { ShopModule } from '../src/shop/shop.module';
import { Product } from '../src/products/product.entity';
import { Cart } from '../src/cart/cart.entity';
import { CartItem } from '../src/cart/cart-item.entity';
import { Order } from '../src/orders/order.entity';
import { OrderItem } from '../src/orders/order-item.entity';
import { Payment } from '../src/payments/payment.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';

const paymentIntentsCreate = jest.fn();

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: paymentIntentsCreate,
      retrieve: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  })),
}));

describe('Orders & Payments (e2e)', () => {
  jest.setTimeout(20000);
  let app: INestApplication;
  let productRepository: Repository<Product>;
  let cartRepository: Repository<Cart>;
  let cartItemRepository: Repository<CartItem>;
  let orderRepository: Repository<Order>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Product, Cart, CartItem, Order, OrderItem, Payment],
          synchronize: true,
        }),
        ProductsModule,
        CartModule,
        OrdersModule,
        PaymentsModule,
        ShopModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.use(
      session({
        secret: 'test-session',
        resave: false,
        saveUninitialized: true,
      }),
    );
    app.use(expressLayouts);
    app.set('layout', 'partials/layout');

    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'shop', method: 0 },
        { path: 'orders/:orderCode', method: 0 },
      ],
    });
    app.setBaseViewsDir(join(__dirname, '..', 'src', 'views'));
    app.setViewEngine('ejs');
    await app.init();

    productRepository = moduleRef.get(getRepositoryToken(Product));
    cartRepository = moduleRef.get(getRepositoryToken(Cart));
    cartItemRepository = moduleRef.get(getRepositoryToken(CartItem));
    orderRepository = moduleRef.get(getRepositoryToken(Order));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('renders shop view', async () => {
    await productRepository.save({
      name: 'E2E Item',
      description: 'desc',
      imageUrl: '/img',
      price: 10000,
      currency: 'KRW',
    });

    const response = await request(app.getHttpServer())
      .get('/shop')
      .expect(200);

    expect(response.text).toContain('Warm Cart Studio');
  });

  it('creates order and payment intent', async () => {
    const product = await productRepository.save({
      name: 'E2E Item',
      description: 'desc',
      imageUrl: '/img',
      price: 10000,
      currency: 'KRW',
    });

    const cart = await cartRepository.save({
      sessionId: randomUUID(),
      totalAmount: 0,
      currency: 'KRW',
    });

    await cartItemRepository.save({
      cart,
      product,
      quantity: 1,
      unitPrice: product.price,
      lineTotal: product.price,
    });

    cart.totalAmount = product.price;
    await cartRepository.save(cart);

    const orderResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        cartId: cart.sessionId,
        customerName: 'Lee',
        customerEmail: 'lee@example.com',
        shippingAddress: 'Seoul street 1',
        contactNumber: '01012341234',
      })
      .expect(201);

    const orderCode = orderResponse.body.orderCode as string;

    paymentIntentsCreate.mockResolvedValue({
      id: 'pi_e2e',
      amount: 10000,
      currency: 'krw',
      client_secret: 'secret_e2e',
      metadata: { orderCode },
    });

    const intentResponse = await request(app.getHttpServer())
      .post('/api/payments/intent')
      .send({ orderCode })
      .expect(201);

    expect(intentResponse.body.clientSecret).toBe('secret_e2e');
  });

  it('renders order confirmation view', async () => {
    const order = await orderRepository.save({
      orderCode: `ORD-${randomUUID().slice(0, 8)}`,
      customerName: 'Lee',
      customerEmail: 'lee@example.com',
      shippingAddress: 'Seoul street 1',
      contactNumber: '01012341234',
      totalAmount: 10000,
      currency: 'KRW',
      status: 'paid',
      items: [
        {
          productName: 'Item',
          productImageUrl: '/img',
          unitPrice: 10000,
          quantity: 1,
          lineTotal: 10000,
        } as OrderItem,
      ],
    });

    const response = await request(app.getHttpServer())
      .get(`/orders/${order.orderCode}`)
      .expect(200);

    expect(response.text).toContain(order.orderCode);
  });
});
