import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, email, plan } = req.body; // plan: 'monthly' | 'annual'

  const priceId = plan === 'annual'
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/profil?checkout=success`,
      cancel_url: `${process.env.APP_URL}/profil?checkout=cancel`,
      metadata: { userId },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erreur création session Stripe:', err);
    res.status(500).json({ error: err.message });
  }
}
