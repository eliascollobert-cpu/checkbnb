// api/notify-waitlist.js
// Reçoit une inscription à la liste d'attente et envoie un email de notification
// directement à Elias — pas de base de données, juste un email à chaque inscription.
//
// Variables d'environnement nécessaires sur Vercel :
//   RESEND_API_KEY   (celle déjà utilisée pour Le Carnet — réutilisable ici)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Adresse d'envoi par défaut de Resend, valable sans vérifier de domaine —
        // suffisant pour une simple notification interne à toi-même.
        from: 'Checkbnb <onboarding@resend.dev>',
        to: ['elias.collobert@gmail.com'],
        subject: 'Nouvelle inscription — liste d\'attente Checkbnb',
        html: `<p>Nouvelle inscription : <strong>${email}</strong></p><p>Reçue le ${new Date().toLocaleString('fr-FR')}.</p>`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return res.status(502).json({ error: `Échec de l'envoi : ${errText}` });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
