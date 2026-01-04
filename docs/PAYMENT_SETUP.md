# Payment System Setup Guide

This guide covers the setup and configuration of the payment system for ZYRA Fashion platform.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Stripe Account Setup](#stripe-account-setup)
4. [Database Migration](#database-migration)
5. [Environment Configuration](#environment-configuration)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing Payment Integration](#testing-payment-integration)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

The payment system uses Stripe for processing payments. The system includes:

- Payment intent creation
- Payment confirmation
- Payment refunds
- Webhook handling for payment status updates
- Database integration for payment tracking

## Prerequisites

- Stripe account (test mode for development)
- Database configured and running
- Environment variables configured

## Stripe Account Setup

### 1. Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a new account or log in
3. Complete account verification (required for production)

### 2. Get API Keys

1. Navigate to **Developers** → **API keys** in Stripe Dashboard
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)
4. **Important**: Keep your secret key secure and never commit it to version control

### 3. Test Cards

Stripe provides test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

For more test cards, see [Stripe Testing Documentation](https://stripe.com/docs/testing)

## Database Migration

### 1. Run Migration

The Payment model has been added to the Prisma schema. Run the migration to create the payments table:

```bash
# Make sure DATABASE_URL is set in your .env file
npx prisma migrate dev --name add_payment_model
```

This will:
- Create the `PaymentStatus` enum
- Create the `payments` table
- Add indexes for performance
- Add foreign key constraints

### 2. Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Generate Prisma Client (if needed)
npx prisma generate
```

### 3. Verify Schema

You can verify the payment table was created:

```bash
npx prisma studio
```

Navigate to the `payments` table to see the structure.

## Environment Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database (already configured)
DATABASE_URL=your_database_url_here
```

### Getting Webhook Secret

The webhook secret is obtained after setting up webhooks (see Webhook Configuration section).

## Webhook Configuration

Webhooks allow Stripe to notify your application about payment events.

### Local Development Setup

1. Install Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

2. Login to Stripe CLI:

```bash
stripe login
```

3. Forward webhooks to local server:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

This will output a webhook signing secret (starts with `whsec_`). Add this to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Production Setup

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your production environment variables

## Testing Payment Integration

### 1. Test Payment Creation

Create a test payment using the API:

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderId": "order_id_here",
    "paymentMethod": "card"
  }'
```

### 2. Test Payment Confirmation

After creating a payment intent, confirm it:

```bash
curl -X PUT http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentId": "payment_id_here",
    "paymentIntentId": "pi_test_123"
  }'
```

### 3. Test Webhooks

Trigger test webhooks using Stripe CLI:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed
```

### 4. Verify Database Records

Check that payments are being stored:

```bash
npx prisma studio
```

Navigate to the `payments` table and verify records are created/updated.

## Production Deployment

### Pre-Deployment Checklist

- [ ] Stripe account verified and activated
- [ ] Production API keys obtained
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to production environment
- [ ] Database migration run on production database
- [ ] Payment flow tested in test mode
- [ ] Error handling verified
- [ ] Logging configured

### Deployment Steps

1. **Set Production Environment Variables**

   Add to your production environment (Vercel, etc.):

   ```env
   STRIPE_SECRET_KEY=sk_live_your_production_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   ```

2. **Run Database Migration**

   ```bash
   npx prisma migrate deploy
   ```

3. **Deploy Application**

   Deploy to your hosting platform (Vercel, etc.)

4. **Configure Webhook Endpoint**

   See [Webhook Configuration](#webhook-configuration) section

5. **Test Production Payment**

   - Use a real test card in test mode first
   - Verify webhooks are received
   - Check database records
   - Monitor error logs

### Switching from Test to Live Mode

1. Update environment variables with live keys
2. Update webhook endpoint to use live mode
3. Test with a small real transaction
4. Monitor closely for the first few transactions

## Troubleshooting

### Common Issues

#### Payment Intent Creation Fails

- **Check**: Stripe API key is correct and has proper permissions
- **Check**: Amount is valid (greater than minimum charge amount)
- **Check**: Currency code is valid

#### Webhooks Not Received

- **Check**: Webhook endpoint URL is correct
- **Check**: Webhook secret matches the endpoint
- **Check**: Server is accessible from internet (for production)
- **Check**: Stripe CLI is running (for local development)

#### Payment Status Not Updating

- **Check**: Webhook handler is processing events correctly
- **Check**: Database connection is working
- **Check**: Payment record exists in database
- **Check**: Logs for error messages

#### Database Errors

- **Check**: Migration has been run: `npx prisma migrate status`
- **Check**: Prisma Client is generated: `npx prisma generate`
- **Check**: Database connection string is correct

### Debugging Tips

1. **Check Stripe Dashboard**: Logs section shows all API requests and responses
2. **Check Application Logs**: Payment operations are logged with details
3. **Use Stripe CLI**: `stripe logs tail` shows real-time events
4. **Database Inspection**: Use Prisma Studio to inspect payment records

### Getting Help

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- Check application logs for detailed error messages

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Always validate webhook signatures** (already implemented)
3. **Use HTTPS** in production
4. **Implement rate limiting** on payment endpoints
5. **Log payment operations** for audit trails
6. **Validate payment amounts** before processing
7. **Implement proper error handling** to avoid exposing sensitive information

## Payment Flow Overview

1. **Customer initiates checkout**
   - Order is created with status `PENDING`
   - Payment intent is created via `/api/payments` (POST)

2. **Customer completes payment**
   - Payment is processed by Stripe
   - Payment status is confirmed via `/api/payments` (PUT)

3. **Webhook updates**
   - Stripe sends webhook event to `/api/payments/webhook`
   - Payment and order status are updated in database

4. **Refunds (if needed)**
   - Refund is processed via `/api/payments` (PATCH)
   - Payment status is updated to `REFUNDED`
   - Order status is updated accordingly

## API Endpoints

- `POST /api/payments` - Create payment intent
- `PUT /api/payments` - Confirm payment
- `PATCH /api/payments` - Refund payment
- `GET /api/payments?paymentId=...` - Get payment status
- `POST /api/payments/webhook` - Stripe webhook handler

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

**Last Updated**: January 2024
