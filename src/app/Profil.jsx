import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { INK, MUTED, LINE, Reveal, BackButton } from './shared';

function EditableRow({ label, value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: editing ? 8 : 2 }}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input type={type} value={draft} onChange={e => setDraft(e.target.value)} autoFocus style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${LINE}`, fontSize: 14, outline: 'none' }} />
          <button onClick={() => { onSave(draft); setEditing(false); }} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: INK, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>OK</button>
          <button onClick={() => { setDraft(value); setEditing(false); }} style={{ padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${LINE}`, background: '#fff', color: MUTED, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{value}</span>
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Modifier</button>
        </div>
      )}
    </div>
  );
}

function PasswordSection({ onSave }) {
  const [editing, setEditing] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (!pass1 || pass1 !== pass2) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (pass1.length < 6) { setError('6 caractères minimum.'); return; }
    const ok = await onSave(pass1);
    if (ok) { setDone(true); setEditing(false); setPass1(''); setPass2(''); setTimeout(() => setDone(false), 2500); }
    else setError('Une erreur est survenue.');
  }

  return (
    <div style={{ padding: '14px 0' }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: editing ? 10 : 2 }}>Mot de passe</div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="password" placeholder="Nouveau mot de passe" value={pass1} onChange={e => setPass1(e.target.value)} autoFocus style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${LINE}`, fontSize: 14, outline: 'none' }} />
          <input type="password" placeholder="Confirmer le mot de passe" value={pass2} onChange={e => setPass2(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${LINE}`, fontSize: 14, outline: 'none' }} />
          {error && <div style={{ fontSize: 12, color: '#B23A3A' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button onClick={handleSave} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: INK, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Mettre à jour</button>
            <button onClick={() => { setEditing(false); setPass1(''); setPass2(''); setError(''); }} style={{ padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${LINE}`, background: '#fff', color: MUTED, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '2px' }}>••••••••</span>
          {done ? <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3F8F5C' }}>Mis à jour ✓</span> :
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Modifier</button>}
        </div>
      )}
    </div>
  );
}

// ---- NOUVEAU : logique Stripe ----
async function startCheckout(hoteInfo, plan, setLoadingPlan, setSubError) {
  setSubError('');
  setLoadingPlan(plan);
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: hoteInfo?.id, email: hoteInfo?.email, plan }),
    });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    const data = await res.json();
    if (!data.url) throw new Error('Pas d\'URL de paiement reçue');
    window.location.href = data.url;
  } catch (err) {
    console.error('Erreur checkout Stripe:', err);
    setSubError('Impossible de démarrer le paiement. Réessaie dans un instant.');
    setLoadingPlan(null);
  }
}

async function openBillingPortal(hoteInfo, setPortalLoading, setSubError) {
  setSubError('');
  setPortalLoading(true);
  try {
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: hoteInfo?.stripe_customer_id }),
    });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    const data = await res.json();
    if (!data.url) throw new Error('Pas d\'URL de portail reçue');
    window.location.href = data.url;
  } catch (err) {
    console.error('Erreur portail Stripe:', err);
    setSubError('Impossible d\'ouvrir la gestion d\'abonnement.');
    setPortalLoading(false);
  }
}

function ProfilPage({ hoteInfo, logementsCount, onUpdateNom, onUpdatePassword, onBack }) {
  const [signingOut, setSigningOut] = useState(false);
  const [hoverPro, setHoverPro] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null); // 'monthly' | 'annual' | null
  const [portalLoading, setPortalLoading] = useState(false);
  const [subError, setSubError] = useState('');

  const isPro = hoteInfo?.subscription_status === 'active';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px 48px' }}>
      <BackButton onClick={onBack} />

      <Reveal delay={80}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0 28px' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 21, flexShrink: 0 }}>
            {(hoteInfo?.nom || '?')[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{hoteInfo?.nom || '—'}</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 1 }}>{hoteInfo?.email || '—'}</div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={140}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, padding: '0 4px' }}>Abonnement</div>
      </Reveal>

      {subError && (
        <div style={{ fontSize: 12.5, color: '#B23A3A', marginBottom: 12, padding: '0 4px' }}>{subError}</div>
      )}

      {isPro ? (
        <Reveal delay={180}>
          <div style={{ background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 20, padding: '18px 20px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>Formule Pro</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                  {hoteInfo?.current_period_end
                    ? `Renouvellement le ${new Date(hoteInfo.current_period_end).toLocaleDateString('fr-FR')}`
                    : `${logementsCount} logement${logementsCount > 1 ? 's' : ''}`}
                </div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 980, border: `1.5px solid ${LINE}` }}>Actif</span>
            </div>
            <button
              onClick={() => openBillingPortal(hoteInfo, setPortalLoading, setSubError)}
              disabled={portalLoading}
              style={{ width: '100%', padding: '12px', borderRadius: 980, border: `1.5px solid ${LINE}`, background: '#fff', color: INK, fontWeight: 700, fontSize: 13.5, cursor: portalLoading ? 'default' : 'pointer', opacity: portalLoading ? 0.6 : 1 }}
            >
              {portalLoading ? 'Ouverture…' : 'Gérer mon abonnement'}
            </button>
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal delay={180}>
            <div style={{ background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 20, padding: '18px 20px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>Formule Gratuite</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{logementsCount}/1 logement inclus</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 980, border: `1.5px solid ${LINE}` }}>Actif</span>
            </div>
          </Reveal>
          <Reveal delay={230}>
            <div onMouseEnter={() => setHoverPro(true)} onMouseLeave={() => setHoverPro(false)} style={{ background: INK, borderRadius: 22, padding: '24px 24px', marginBottom: 28, color: '#fff', transform: hoverPro ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Passer à Pro</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Jusqu'à 5 logements, sans limite</div>
                </div>
                <div style={{ textAlign: 'right' }}><span style={{ fontSize: 26, fontWeight: 800 }}>9€</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>/mois</span></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {['Jusqu\'à 5 logements', 'Preuves photo illimitées', 'Support prioritaire'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => startCheckout(hoteInfo, 'monthly', setLoadingPlan, setSubError)}
                disabled={loadingPlan !== null}
                style={{ width: '100%', padding: '13px', borderRadius: 980, border: 'none', background: '#fff', color: INK, fontWeight: 700, fontSize: 14, cursor: loadingPlan ? 'default' : 'pointer', opacity: loadingPlan === 'annual' ? 0.6 : 1 }}
              >
                {loadingPlan === 'monthly' ? 'Redirection…' : 'Passer à Pro (mensuel)'}
              </button>
              <button
                onClick={() => startCheckout(hoteInfo, 'annual', setLoadingPlan, setSubError)}
                disabled={loadingPlan !== null}
                style={{ width: '100%', padding: '10px', marginTop: 8, borderRadius: 980, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 13, cursor: loadingPlan ? 'default' : 'pointer', opacity: loadingPlan === 'monthly' ? 0.6 : 1 }}
              >
                {loadingPlan === 'annual' ? 'Redirection…' : 'Ou en facturation annuelle (2 mois offerts)'}
              </button>
            </div>
          </Reveal>
        </>
      )}

      <Reveal delay={280}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, padding: '0 4px' }}>Informations du compte</div>
      </Reveal>
      <Reveal delay={320}>
        <div style={{ background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 18, padding: '2px 18px', marginBottom: 24 }}>
          <EditableRow label="Nom complet" value={hoteInfo?.nom || ''} onSave={onUpdateNom} />
          <PasswordSection onSave={onUpdatePassword} />
        </div>
      </Reveal>

      <Reveal delay={370}>
        <button onClick={async () => { setSigningOut(true); await supabase.auth.signOut(); }} disabled={signingOut} style={{ width: '100%', padding: '15px', borderRadius: 980, border: `1.5px solid ${LINE}`, background: '#fff', color: INK, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>
          {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
      </Reveal>
    </div>
  );
}

function EmptyState({ onOpenAjout }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 30px', color: MUTED, background: '#fff', border: `1.5px dashed ${LINE}`, borderRadius: 20 }}>
      <p style={{ fontSize: 14.5, marginBottom: 20 }}>Aucun appartement pour l'instant.</p>
      <button onClick={onOpenAjout} style={{ padding: '12px 24px', borderRadius: 980, border: 'none', background: INK, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Ajouter mon premier appartement</button>
    </div>
  );
}

export { ProfilPage as default, EmptyState };
