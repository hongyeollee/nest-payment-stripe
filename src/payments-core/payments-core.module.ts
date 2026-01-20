import { Module, DynamicModule, Global } from '@nestjs/common';
import { PAYMENTS_CORE_CONFIG } from './payments-core.constants';
import { PaymentsCoreService } from './payments-core.service';
import type { PaymentsCoreConfig } from './payments-core.types';
import { createPaymentsCoreConfig } from './payments-core.config';

@Global()
@Module({})
export class PaymentsCoreModule {
  static forRoot(config: PaymentsCoreConfig): DynamicModule {
    return {
      module: PaymentsCoreModule,
      providers: [
        { provide: PAYMENTS_CORE_CONFIG, useValue: config },
        PaymentsCoreService,
      ],
      exports: [PaymentsCoreService, PAYMENTS_CORE_CONFIG],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return PaymentsCoreModule.forRoot(createPaymentsCoreConfig(process.env));
  }
}
