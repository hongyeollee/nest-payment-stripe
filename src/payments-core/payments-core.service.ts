import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PAYMENTS_CORE_CONFIG } from './payments-core.constants';
import type { PaymentsCoreConfig } from './payments-core.types';

@Injectable()
export class PaymentsCoreService {
  private readonly stripe: Stripe;

  constructor(
    @Inject(PAYMENTS_CORE_CONFIG)
    private readonly config: PaymentsCoreConfig,
  ) {
    this.stripe = new Stripe(this.config.stripeSecretKey, {
      apiVersion: this.config.stripeApiVersion ?? '2025-12-15.clover',
    });
  }

  getStripeClient() {
    return this.stripe;
  }

  getPublishableKey() {
    return this.config.stripePublishableKey;
  }

  getWebhookSecret() {
    return this.config.stripeWebhookSecret;
  }
}
