import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/db';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing, we need the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Get the raw body
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE_WEBHOOK] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('[STRIPE_WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!prisma) {
      console.error('[STRIPE_WEBHOOK] Database not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const error = err as Error;
      console.error('[STRIPE_WEBHOOK] Signature verification failed:', error.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    console.log(`[STRIPE_WEBHOOK] Processing event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionTrialWillEnd(subscription);
        break;
      }

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Error processing webhook:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Event Handlers

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Checkout session completed:', session.id);

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    console.error('[STRIPE_WEBHOOK] Missing customer or subscription ID');
    return;
  }

  // Retrieve the full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

  // Find user by email (from session) or create/update subscription
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    console.error('[STRIPE_WEBHOOK] No customer email found');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!user) {
    console.error('[STRIPE_WEBHOOK] User not found:', customerEmail);
    return;
  }

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: subscription.status,
      currentPeriodEnd: new Date((subscription.current_period_end as number) * 1000),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: subscription.status,
      currentPeriodEnd: new Date((subscription.current_period_end as number) * 1000),
    },
  });

  // Update user role to PREMIUM_USER
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'PREMIUM_USER' },
  });

  console.log('[STRIPE_WEBHOOK] Subscription created for user:', user.id);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Subscription created:', subscription.id);

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    console.error('[STRIPE_WEBHOOK] Missing customer ID');
    return;
  }

  // Find user by stripe customer ID
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (existingSubscription) {
    // Update existing subscription
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(((subscription as any).current_period_end as number) * 1000),
      },
    });

    // Update user role
    await prisma.user.update({
      where: { id: existingSubscription.userId },
      data: { role: 'PREMIUM_USER' },
    });

    console.log('[STRIPE_WEBHOOK] Updated subscription for user:', existingSubscription.userId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Subscription updated:', subscription.id);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.error('[STRIPE_WEBHOOK] Subscription not found:', subscription.id);
    return;
  }

  // Update subscription
  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: subscription.status,
      currentPeriodEnd: new Date(((subscription as any).current_period_end as number) * 1000),
    },
  });

  // Update user role based on subscription status
  const isActive = ['active', 'trialing'].includes(subscription.status);
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: { role: isActive ? 'PREMIUM_USER' : 'USER' },
  });

  console.log('[STRIPE_WEBHOOK] Subscription updated, status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Subscription deleted:', subscription.id);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.error('[STRIPE_WEBHOOK] Subscription not found:', subscription.id);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: subscription.status,
    },
  });

  // Downgrade user to regular USER
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: { role: 'USER' },
  });

  console.log('[STRIPE_WEBHOOK] User downgraded to USER role');
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Invoice payment succeeded:', invoice.id);

  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    console.log('[STRIPE_WEBHOOK] No subscription associated with invoice');
    return;
  }

  // Retrieve subscription to get current period end
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existingSubscription) {
    console.error('[STRIPE_WEBHOOK] Subscription not found:', subscriptionId);
    return;
  }

  // Update subscription with new period end
  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: subscription.status,
      currentPeriodEnd: new Date((subscription.current_period_end as number) * 1000),
    },
  });

  // Ensure user is PREMIUM_USER
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: { role: 'PREMIUM_USER' },
  });

  console.log('[STRIPE_WEBHOOK] Subscription renewed successfully');
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Invoice payment failed:', invoice.id);

  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    console.log('[STRIPE_WEBHOOK] No subscription associated with invoice');
    return;
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existingSubscription) {
    console.error('[STRIPE_WEBHOOK] Subscription not found:', subscriptionId);
    return;
  }

  // Update subscription status to past_due or unpaid
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: subscription.status,
    },
  });

  // Optionally downgrade user if subscription is no longer active
  if (!['active', 'trialing'].includes(subscription.status)) {
    await prisma.user.update({
      where: { id: existingSubscription.userId },
      data: { role: 'USER' },
    });
    console.log('[STRIPE_WEBHOOK] User downgraded due to payment failure');
  }
}

async function handleSubscriptionTrialWillEnd(subscription: Stripe.Subscription) {
  if (!prisma) {
    console.error('[STRIPE_WEBHOOK] Database not available');
    return;
  }

  console.log('[STRIPE_WEBHOOK] Subscription trial will end:', subscription.id);

  // This is where you could send an email notification to the user
  // about their trial ending soon

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });

  if (!existingSubscription) {
    console.error('[STRIPE_WEBHOOK] Subscription not found:', subscription.id);
    return;
  }

  console.log(
    `[STRIPE_WEBHOOK] Trial ending for user ${existingSubscription.user.email} on ${new Date(subscription.trial_end! * 1000)}`
  );

  // TODO: Send email notification to user
  // You can integrate with services like SendGrid, Resend, etc.
}
