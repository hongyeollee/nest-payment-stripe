import { Test } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

const createResponse = () => ({
  redirect: jest.fn(),
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
  json: jest.fn(),
});

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    findPayments: jest.Mock;
    createPaymentIntent: jest.Mock;
    refund: jest.Mock;
    cancelPayment: jest.Mock;
    confirmPaymentFromWebhook: jest.Mock;
  };

  beforeEach(async () => {
    paymentsService = {
      findPayments: jest.fn(),
      createPaymentIntent: jest.fn(),
      refund: jest.fn(),
      cancelPayment: jest.fn(),
      confirmPaymentFromWebhook: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: paymentsService }],
    }).compile();

    controller = moduleRef.get(PaymentsController);
  });

  it('returns payment list', async () => {
    paymentsService.findPayments.mockResolvedValue([{ orderCode: 'ORD-1' }]);

    const result = await controller.getPayments('ORD-1');

    expect(result).toHaveLength(1);
    expect(paymentsService.findPayments).toHaveBeenCalledWith('ORD-1');
  });

  it('redirects after refund', async () => {
    const response = createResponse();

    await controller.refund(
      { orderCode: 'ORD-1' },
      response as any,
    );

    expect(response.redirect).toHaveBeenCalledWith('/orders/ORD-1');
  });

  it('redirects after cancel', async () => {
    const response = createResponse();

    await controller.cancel(
      { orderCode: 'ORD-2' },
      response as any,
    );

    expect(response.redirect).toHaveBeenCalledWith('/orders/ORD-2');
  });
});
