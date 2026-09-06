import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { customerId } = req.body;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/profil`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erreur création session portail Stripe:', err);
    res.status(500).json({ error: err.message });
  }
}
