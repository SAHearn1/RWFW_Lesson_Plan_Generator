# Stripe Webhook Setup Guide

This guide will help you configure Stripe webhooks for your RWFW Lesson Plan Generator application.

## Overview

The webhook handler is located at: `src/app/api/webhooks/stripe/route.ts`

It handles the following events:
- `checkout.session.completed` - When a user completes checkout
- `customer.subscription.created` - When a subscription is created
- `customer.subscription.updated` - When a subscription changes
- `customer.subscription.deleted` - When a subscription is canceled
- `invoice.payment_succeeded` - When a payment succeeds
- `invoice.payment_failed` - When a payment fails
- `customer.subscription.trial_will_end` - When a trial is about to end

## Setup Instructions

### 1. Get Your Webhook Secret

You have two options:

#### Option A: Stripe Dashboard (Recommended)

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   - **Production:** `https://your-domain.vercel.app/api/webhooks/stripe`
   - **Development:** Use [Stripe CLI](#local-testing-with-stripe-cli) for local testing
4. Select events to listen to:
   ```
   checkout.session.completed
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   customer.subscription.trial_will_end
   ```
   Or select **"Select all events"** for simplicity
5. Click **"Add endpoint"**
6. Click **"Reveal"** to see your webhook signing secret (starts with `whsec_...`)
7. Copy this secret

#### Option B: Stripe CLI

```bash
# Create webhook endpoint programmatically
stripe webhook_endpoints create \
  --url "https://your-domain.vercel.app/api/webhooks/stripe" \
  --enabled-event checkout.session.completed \
  --enabled-event customer.subscription.created \
  --enabled-event customer.subscription.updated \
  --enabled-event customer.subscription.deleted \
  --enabled-event invoice.payment_succeeded \
  --enabled-event invoice.payment_failed \
  --enabled-event customer.subscription.trial_will_end

# The response will include your webhook secret
```

### 2. Add Secret to Vercel

1. Go to your Vercel project
2. Navigate to **Settings > Environment Variables**
3. Add a new variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Your webhook secret (e.g., `whsec_xxxxxxxxxxxxx`)
   - **Environments:** Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

### 3. Verify Setup

After deployment, test your webhook:

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. Click **"Send test webhook"**
4. Select an event (e.g., `customer.subscription.created`)
5. Click **"Send test webhook"**
6. Check the response - you should see a **200 OK** status

## Local Testing with Stripe CLI

For local development, use the Stripe CLI to forward webhook events:

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (via Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks to Local Server

```bash
# Start your Next.js dev server first
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like: `whsec_xxxxxxxxxxxxx`

### 4. Set Local Environment Variable

Add to your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Test Locally

Trigger test events:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test checkout completed
stripe trigger checkout.session.completed
```

## What the Webhook Does

### Subscription Lifecycle Management

1. **Checkout Completed**
   - Creates subscription record in database
   - Upgrades user role to `PREMIUM_USER`
   - Links Stripe customer ID to user

2. **Subscription Created/Updated**
   - Updates subscription status
   - Updates `currentPeriodEnd` date
   - Manages user role based on subscription status

3. **Subscription Deleted**
   - Marks subscription as canceled
   - Downgrades user to `USER` role

4. **Payment Succeeded**
   - Renews subscription period
   - Ensures user maintains `PREMIUM_USER` role

5. **Payment Failed**
   - Updates subscription status to `past_due`
   - May downgrade user if subscription becomes inactive

## Monitoring Webhooks

### Stripe Dashboard

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View:
   - Recent deliveries
   - Success/failure rates
   - Retry attempts
   - Request/response logs

### Application Logs

The webhook handler logs all events to console:

```
[STRIPE_WEBHOOK] Processing event: customer.subscription.created
[STRIPE_WEBHOOK] Subscription created for user: cuid_xxx
```

Check your Vercel logs:
1. Go to your Vercel project
2. Navigate to **Deployments**
3. Click on a deployment
4. View **Functions** logs

## Troubleshooting

### Webhook Returns 400: Invalid Signature

- **Cause:** Wrong webhook secret
- **Fix:** Ensure `STRIPE_WEBHOOK_SECRET` in Vercel matches the secret from Stripe Dashboard

### Webhook Returns 500: Webhook Secret Not Configured

- **Cause:** Missing environment variable
- **Fix:** Add `STRIPE_WEBHOOK_SECRET` to Vercel and redeploy

### Subscription Not Created

- **Cause:** User email not found in database
- **Fix:** Ensure user creates an account before starting checkout

### User Not Upgraded to Premium

- **Cause:** Webhook not firing or database update failed
- **Fix:** Check Stripe webhook logs and Vercel function logs

## Security Notes

- ✅ Webhook signature is verified before processing
- ✅ Only accepts POST requests
- ✅ Uses environment variable for webhook secret
- ✅ Logs all events for audit trail
- ✅ Gracefully handles missing data

## Next Steps

After setting up webhooks, you may want to:

1. **Add email notifications** for trial endings and payment failures
2. **Implement retry logic** for failed database updates
3. **Add monitoring alerts** for webhook failures
4. **Create admin dashboard** to view subscription analytics

## Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
