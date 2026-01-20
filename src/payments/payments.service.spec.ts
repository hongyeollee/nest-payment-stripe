import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './payment.entity';
import { OrdersService } from '../orders/orders.service';
import { PaymentsCoreService } from '../payments-core/payments-core.service';

const paymentIntentsCreate = jest.fn();
const paymentIntentsRetrieve = jest.fn();
const paymentIntentsCancel = jest.fn();
const refundsCreate = jest.fn();

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: paymentIntentsCreate,
      retrieve: paymentIntentsRetrieve,
      cancel: paymentIntentsCancel,
    },
    refunds: {
      create: refundsCreate,
    },
  })),
}));

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepository: ReturnType<typeof createRepositoryMock>;
  let ordersService: {
    findByCode: jest.Mock;
    updatePaymentInfo: jest.Mock;
    markPaid: jest.Mock;
    markCancelled: jest.Mock;
    markRefunded: jest.Mock;
  };

  beforeEach(async () => {
    paymentsRepository = createRepositoryMock();
    ordersService = {
      findByCode: jest.fn(),
      updatePaymentInfo: jest.fn(),
      markPaid: jest.fn(),
      markCancelled: jest.fn(),
      markRefunded: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: paymentsRepository },
        { provide: OrdersService, useValue: ordersService },
        {
          provide: PaymentsCoreService,
          useValue: {
            getStripeClient: jest.fn().mockReturnValue(new (Stripe as any)()),
            getPublishableKey: jest.fn(),
            getWebhookSecret: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
    jest.clearAllMocks();
  });

  it('creates payment intent and stores payment', async () => {
    ordersService.findByCode.mockResolvedValue({
      orderCode: 'ORD-1',
      totalAmount: 15000,
      currency: 'KRW',
    });

    paymentIntentsCreate.mockResolvedValue({
      id: 'pi_1',
      amount: 15000,
      currency: 'krw',
      client_secret: 'secret',
      metadata: { orderCode: 'ORD-1' },
    });

    paymentsRepository.create.mockImplementation((value) => value);
    paymentsRepository.save.mockImplementation((value) => value);

    const result = await service.createPaymentIntent('ORD-1');

    expect(result.clientSecret).toBe('secret');
    expect(ordersService.updatePaymentInfo).toHaveBeenCalledWith('ORD-1', {
      stripePaymentIntentId: 'pi_1',
    });
  });

  it('confirms payment from webhook', async () => {
    paymentsRepository.findOne.mockResolvedValue({
      orderCode: 'ORD-1',
      paymentIntentId: 'pi_1',
      status: PaymentStatus.Pending,
      receiptUrl: null,
    });

    paymentIntentsRetrieve.mockResolvedValue({
      id: 'pi_1',
      latest_charge: {
        id: 'ch_1',
        receipt_url: 'https://receipt',
      },
    });

    const result = await service.confirmPaymentFromWebhook('pi_1');

    expect(result?.status).toBe(PaymentStatus.Succeeded);
    expect(ordersService.markPaid).toHaveBeenCalled();
  });

  it('refunds payment', async () => {
    ordersService.findByCode.mockResolvedValue({
      orderCode: 'ORD-1',
      stripePaymentIntentId: 'pi_1',
    });

    paymentsRepository.findOne.mockResolvedValue({
      paymentIntentId: 'pi_1',
      status: PaymentStatus.Succeeded,
    });

    refundsCreate.mockResolvedValue({ id: 're_1' });

    const result = await service.refund('ORD-1');

    expect(result.id).toBe('re_1');
    expect(ordersService.markRefunded).toHaveBeenCalled();
  });

  it('returns null when webhook payment missing', async () => {
    paymentsRepository.findOne.mockResolvedValue(null);

    const result = await service.confirmPaymentFromWebhook('pi_missing');

    expect(result).toBeNull();
  });

  it('cancels payment intent and updates status', async () => {
    ordersService.findByCode.mockResolvedValue({
      orderCode: 'ORD-1',
      stripePaymentIntentId: 'pi_1',
    });
    paymentsRepository.findOne.mockResolvedValue({
      orderCode: 'ORD-1',
      paymentIntentId: 'pi_1',
      status: PaymentStatus.Pending,
    });

    paymentIntentsCancel.mockResolvedValue({});

    const result = await service.cancelPayment('ORD-1');

    expect(paymentIntentsCancel).toHaveBeenCalledWith('pi_1');
    expect(result?.status).toBe(PaymentStatus.Cancelled);
  });

  it('throws when refund payment not found', async () => {
    ordersService.findByCode.mockResolvedValue({
      orderCode: 'ORD-1',
      stripePaymentIntentId: 'pi_1',
    });
    paymentsRepository.findOne.mockResolvedValue(null);

    await expect(service.refund('ORD-1')).rejects.toThrow('Payment not found');
  });

  it('finds payments by order code', async () => {
    paymentsRepository.find.mockResolvedValue([{ orderCode: 'ORD-1' }]);

    const result = await service.findPayments('ORD-1');

    expect(result).toHaveLength(1);
  });
});
