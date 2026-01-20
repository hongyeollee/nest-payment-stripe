import type { PaymentsCoreConfig } from './payments-core.types';

export type PaymentsCoreEnvConfig = {
  PAYMENT_STRIPE_SECRET_KEY?: string;
  PAYMENT_STRIPE_PUBLISHABLE_KEY?: string;
  PAYMENT_STRIPE_WEBHOOK_SECRET?: string;
  PAYMENT_STRIPE_API_VERSION?: string;
};

export const createPaymentsCoreConfig = (
  env: PaymentsCoreEnvConfig,
): PaymentsCoreConfig => {
  return {
    stripeSecretKey: env.PAYMENT_STRIPE_SECRET_KEY ?? '',
    stripePublishableKey: env.PAYMENT_STRIPE_PUBLISHABLE_KEY ?? '',
    stripeWebhookSecret: env.PAYMENT_STRIPE_WEBHOOK_SECRET ?? '',
    stripeApiVersion: env.PAYMENT_STRIPE_API_VERSION ?? '2025-12-15.clover',
  };
};
