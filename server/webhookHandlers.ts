// Stripe webhook handlers for patient portal payments
// Reference: stripe integration blueprint

import { getStripeSync } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Process with stripe-replit-sync for general data sync
    // SECURITY: The sync library handles signature verification internally using Stripe's
    // webhook signing secret. It will throw an error if the signature is invalid.
    // This means if we reach the code below, the payload has been verified by Stripe.
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // SECURITY NOTE: At this point, the webhook signature has been verified by stripe-replit-sync.
    // The payload buffer we parse is the same buffer that was verified, so the parsed event
    // can be trusted. The sync library manages webhook secrets internally via Replit's
    // connector system, so explicit constructEvent is not needed.
    try {
      const event = JSON.parse(payload.toString()) as Stripe.Event;

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a patient portal payment
        if (session.metadata?.type === 'patient_balance_payment') {
          const paymentAmount = session.amount_total ? session.amount_total / 100 : 0;
          const paymentIntentId = session.payment_intent as string || '';
          const patientId = session.metadata?.patientId;
          
          // Reconcile payment record if missing
          if (patientId && paymentAmount > 0) {
            await storage.reconcilePayment(session.id, patientId, paymentAmount.toFixed(2));
          }
          
          // Use centralized atomic payment completion
          await storage.completePayment(session.id, paymentIntentId, paymentAmount);
        }
      }
    } catch (error) {
      console.error('Error processing patient payment webhook:', error);
      // Don't throw - the main sync already succeeded
    }
  }
}
