import type Stripe from 'stripe';

export type PaymentsCoreConfig = {
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  stripeApiVersion?: Stripe.StripeConfig['apiVersion'];
};
