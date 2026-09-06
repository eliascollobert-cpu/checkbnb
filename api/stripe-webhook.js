import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const config = { api: { bodyParser: false } };

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const rawBody = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  const obj = event.data.object;

  try {
    if (event.type === 'checkout.session.completed') {
      await supabase.from('hotes').update({
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.subscription,
        subscription_status: 'active',
      }).eq('id', obj.client_reference_id ?? obj.metadata?.userId);
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await supabase.from('hotes').update({
        subscription_status: obj.status,
        current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
        subscription_plan: obj.items?.data?.[0]?.price?.id,
      }).eq('stripe_subscription_id', obj.id);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Erreur mise à jour Supabase depuis webhook:', err);
    res.status(500).json({ error: err.message });
  }
}
