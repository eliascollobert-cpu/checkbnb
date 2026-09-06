import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const INK = '#0A0A0A', MUTED = '#8A8A85', LINE = '#E9E7E1', WARM = '#FBFAF7';

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function formatDateLong() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function useReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return [ref, visible];
}
function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal(delay);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)',
      transition: 'opacity 0.45s cubic-bezier(.16,.8,.2,1), transform 0.45s cubic-bezier(.16,.8,.2,1)',
    }}>{children}</div>
  );
}
function AnimatedNumber({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const duration = 750, start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{n}</>;
}

function BackButton({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer',
      padding: '8px 10px 8px 4px', marginLeft: -4, borderRadius: 980, color: INK, fontSize: 15, fontWeight: 600,
      transform: hover ? 'translateX(-2px)' : 'translateX(0)', transition: 'transform 0.15s ease',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 6l-6 6 6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Retour
    </button>
  );
}

function PressableCircle({ children, size = 34, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{
        width: size, height: size, borderRadius: '50%', background: INK, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.4,
        cursor: 'pointer', transform: pressed ? 'scale(0.9)' : 'scale(1)', transition: 'transform 0.15s ease', flexShrink: 0,
      }}
    >{children}</div>
  );
}

function StatusDot({ actif }) {
  return (
    <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-block', flexShrink: 0 }}>
      {actif && <span style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: INK, opacity: 0.15, animation: 'pulseDot 1.8s ease-out infinite' }} />}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: actif ? INK : 'transparent', border: actif ? 'none' : `1.5px solid ${MUTED}` }} />
    </span>
  );
}

function ProgressRing({ done, total, size = 38 }) {
  const pct = total ? Math.round((done / total) * 360) : 0;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0, background: `conic-gradient(${INK} ${pct}deg, ${LINE} 0deg)`, transition: 'background 0.3s ease' }}>
      <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: MUTED }}>
        {total > 0 ? `${done}/${total}` : ''}
      </div>
    </div>
  );
}

const Icons = {
  logements: <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 21V9.5L12 4l8 5.5V21" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 21v-6h5v6" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  checklist: <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M8 4.5h8a1.5 1.5 0 0 1 1.5 1.5v14a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V6A1.5 1.5 0 0 1 8 4.5Z" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" stroke={INK} strokeWidth="1.7" strokeLinecap="round" /><path d="M9 12.5l1.8 1.8L14.5 10.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 17.5h6" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /></svg>,
  reassort: <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8Z" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" /><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /></svg>,
  profil: <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke={INK} strokeWidth="1.8" /><path d="M5 20c0.8-4 3.8-6 7-6s6.2 2 7 6" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /></svg>,
};

function ShortcutTile({ icon, label, badge, delay, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <Reveal delay={delay}>
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
        width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: '18px',
        borderRadius: 18, border: `1.5px solid ${LINE}`, background: hover ? '#F2F1EC' : '#fff', cursor: 'pointer',
        textAlign: 'left', transform: hover ? 'translateY(-2px)' : 'translateY(0)', transition: 'background 0.2s ease, transform 0.2s ease',
        position: 'relative',
      }}>
        {badge > 0 && (
          <span style={{ position: 'absolute', top: 12, right: 12, background: INK, color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 980, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span>
        )}
        <div style={{ width: 34, height: 34, borderRadius: 10, background: WARM, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      </button>
    </Reveal>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState('signup');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { nom }, emailRedirectTo: window.location.origin } });
      if (error) setError(error.message); else setSignupSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  if (signupSent) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, border: `1px solid ${LINE}`, borderRadius: 22, padding: '40px 34px' }}>
          <h2 style={{ fontSize: 22, marginBottom: 10, fontWeight: 700 }}>Vérifie tes emails</h2>
          <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>On t'a envoyé un lien de confirmation à<br /><strong style={{ color: INK }}>{email}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 34, color: INK, marginBottom: 36 }}>Checkbnb</div>

      <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 22, padding: '34px 32px' }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, textAlign: 'center', marginBottom: 6, color: INK }}>
          {mode === 'signup' ? 'Créer un compte' : 'Content de te revoir'}
        </h1>
        <p style={{ fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 24 }}>
          {mode === 'signup' ? 'Commencez à automatiser le ménage de vos logements.' : 'Reconnecte-toi à ton espace.'}
        </p>

        <button onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px', borderRadius: 980, border: `1px solid ${LINE}`, background: '#fff', fontSize: 14, fontWeight: 600, color: INK, cursor: 'pointer', marginBottom: 18 }}>
          <svg width="17" height="17" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 14-5.4l-6.5-5.5C29.5 34.7 26.9 35.6 24 35.6c-5.2 0-9.7-3.5-11.3-8.2l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.4 36.4 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Continuer avec Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: LINE }} /><span style={{ fontSize: 12, color: MUTED }}>ou par email</span><div style={{ flex: 1, height: 1, background: LINE }} />
        </div>

        <div style={{ display: 'flex', background: '#F0F0F0', borderRadius: 980, padding: 4, marginBottom: 22 }}>
          <button onClick={() => setMode('login')} style={{ flex: 1, padding: '9px', borderRadius: 980, border: 'none', cursor: 'pointer', background: mode === 'login' ? '#fff' : 'transparent', fontWeight: 600, fontSize: 13.5, color: mode === 'login' ? INK : MUTED, boxShadow: mode === 'login' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>Connexion</button>
          <button onClick={() => setMode('signup')} style={{ flex: 1, padding: '9px', borderRadius: 980, border: 'none', cursor: 'pointer', background: mode === 'signup' ? '#fff' : 'transparent', fontWeight: 600, fontSize: 13.5, color: mode === 'signup' ? INK : MUTED, boxShadow: mode === 'signup' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>Inscription</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: INK, display: 'block', marginBottom: 7 }}>Nom complet</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" required style={{ width: '100%', padding: '12px 16px', borderRadius: 980, border: `1px solid ${LINE}`, fontSize: 14, outline: 'none' }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: INK, display: 'block', marginBottom: 7 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@example.com" required style={{ width: '100%', padding: '12px 16px', borderRadius: 980, border: `1px solid ${LINE}`, fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: INK, display: 'block', marginBottom: 7 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ width: '100%', padding: '12px 16px', borderRadius: 980, border: `1px solid ${LINE}`, fontSize: 14, outline: 'none' }} />
          </div>
          {error && <div style={{ fontSize: 12.5, color: '#B23A3A', background: '#FDECEC', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 980, border: 'none', background: INK, color: '#fff', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', marginTop: 4 }}>
            {loading ? 'Un instant…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 22, maxWidth: 340 }}>
        En continuant, vous acceptez les conditions d'utilisation de Checkbnb.
      </p>
    </div>
  );
}

const TOUR_STEPS = [
  { target: null, titre: 'Bienvenue sur Checkbnb', texte: "Fait pour les hôtes qui gèrent eux-mêmes le ménage de leurs appartements — sans jamais rien oublier entre deux clients." },
  { target: 'hero', titre: "Chaque jour, en un coup d'œil", texte: "Ce bloc te dit exactement quels appartements préparer aujourd'hui, à partir de ton calendrier Airbnb.", position: 'bottom' },
  { target: 'raccourcis', titre: 'Checklist et réassort', texte: 'Accède ici à tes checklists de ménage et au suivi de tes stocks (café, savon...).', position: 'top' },
  { target: 'ajouter', titre: 'Commençons', texte: "Clique ici pour ajouter ton premier appartement, avec son lien de calendrier.", position: 'top' },
];

function useRect(ref, step) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    function update() {
      if (ref?.current) setRect(ref.current.getBoundingClientRect());
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const t = setTimeout(update, 50);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); clearTimeout(t); };
  }, [ref, step]);
  return rect;
}

function TourTooltip({ rect, position, titre, texte, children }) {
  const pad = 10;
  const style = rect ? {
    position: 'fixed', zIndex: 71, maxWidth: 300,
    left: Math.min(Math.max(rect.left, 16), window.innerWidth - 316),
    top: position === 'bottom' ? rect.bottom + pad + 14 : undefined,
    bottom: position === 'top' ? window.innerHeight - rect.top + pad + 14 : undefined,
  } : {};

  return (
    <div style={style}>
      {position === 'bottom' && (
        <div style={{ marginLeft: 24, marginBottom: -2, animation: 'bounceArrow 1.2s ease-in-out infinite' }}>
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M2 2l9 9 9-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
      <div style={{ background: INK, color: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{titre}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: 14 }}>{texte}</div>
        {children}
      </div>
      {position === 'top' && (
        <div style={{ marginLeft: 24, marginTop: -2, animation: 'bounceArrowDown 1.2s ease-in-out infinite' }}>
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M2 12l9-9 9 9" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
    </div>
  );
}

function OnboardingGuide({ onFinish, onOpenAjout, refs }) {
  const [step, setStep] = useState(0);
  const isLast = step === TOUR_STEPS.length - 1;
  const current = TOUR_STEPS[step];
  const targetRef = current.target ? refs[current.target] : null;
  const rect = useRect(targetRef, step);
  const hasSpotlight = current.target && rect;

  const spotlightStyle = hasSpotlight ? {
    position: 'fixed', zIndex: 65, pointerEvents: 'none',
    left: rect.left - 8, top: rect.top - 8, width: rect.width + 16, height: rect.height + 16,
    borderRadius: 20, boxShadow: '0 0 0 9999px rgba(15,15,15,0.72)',
    border: '2px solid #fff', transition: 'all 0.35s cubic-bezier(.16,.8,.2,1)',
  } : null;

  function handleNext() {
    if (isLast) { onFinish(); onOpenAjout(); }
    else setStep(s => s + 1);
  }

  return (
    <>
      <style>{`
        @keyframes bounceArrow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes bounceArrowDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulseRing { 0% { box-shadow: 0 0 0 9999px rgba(15,15,15,0.72), 0 0 0 0 rgba(255,255,255,0.5); } 100% { box-shadow: 0 0 0 9999px rgba(15,15,15,0.72), 0 0 0 10px rgba(255,255,255,0); } }
      `}</style>

      {!current.target && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, padding: 20 }}>
          <Reveal key={step} delay={0}>
            <div style={{ background: '#fff', borderRadius: 28, padding: '40px 36px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 23, fontWeight: 700, marginBottom: 14 }}>{current.titre}</h2>
              <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6, marginBottom: 28 }}>{current.texte}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onFinish} style={{ flex: 1, padding: '13px', borderRadius: 980, border: `1.5px solid ${LINE}`, background: '#fff', color: MUTED, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Passer</button>
                <button onClick={handleNext} style={{ flex: 1.4, padding: '13px', borderRadius: 980, border: 'none', background: INK, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Suivant</button>
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {hasSpotlight && (
        <>
          <div style={{ ...spotlightStyle, animation: 'pulseRing 1.6s ease-out infinite' }} />
          <TourTooltip rect={rect} position={current.position} titre={current.titre} texte={current.texte}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {TOUR_STEPS.map((_, i) => (
                  <span key={i} style={{ width: i === step ? 14 : 5, height: 5, borderRadius: 980, background: i === step ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onFinish} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Passer</button>
                <button onClick={handleNext} style={{ padding: '7px 16px', borderRadius: 980, border: 'none', background: '#fff', color: INK, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                  {isLast ? 'Ajouter' : 'Suivant'}
                </button>
              </div>
            </div>
          </TourTooltip>
        </>
      )}
    </>
  );
}

function AjouterLogementModal({ onClose, onSave }) {
  const [nom, setNom] = useState('');
  const [icalUrl, setIcalUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ nom, ical_url: icalUrl });
    setSaving(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>Ajouter un appartement</h2>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 22, lineHeight: 1.6 }}>
          Le lien iCal se trouve dans Airbnb → ton annonce → Calendrier → "Exporter le calendrier".
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 7 }}>Nom du logement</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Bastille · 3B" required style={{ width: '100%', padding: '12px 15px', borderRadius: 12, border: `1.5px solid ${LINE}`, fontSize: 14.5, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 7 }}>Lien du calendrier iCal</label>
            <input value={icalUrl} onChange={e => setIcalUrl(e.target.value)} placeholder="https://www.airbnb.fr/calendar/ical/..." style={{ width: '100%', padding: '12px 15px', borderRadius: 12, border: `1.5px solid ${LINE}`, fontSize: 14.5, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 980, border: `1.5px solid ${LINE}`, background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '13px', borderRadius: 980, border: 'none', background: INK, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Ajout…' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function useStatuts(logements, refreshKey) {
  const [statuts, setStatuts] = useState({});
  useEffect(() => {
    logements.forEach(l => {
      if (!l.ical_url) { setStatuts(s => ({ ...s, [l.id]: { loading: false, erreur: 'Aucun calendrier lié' } })); return; }
      fetch(`/api/lire-calendrier?url=${encodeURIComponent(l.ical_url)}`)
        .then(r => r.json())
        .then(data => setStatuts(s => ({ ...s, [l.id]: { loading: false, ...data } })))
        .catch(() => setStatuts(s => ({ ...s, [l.id]: { loading: false, erreur: 'Impossible de lire ce calendrier' } })));
    });
  }, [logements.map(l => l.id + l.ical_url).join(','), refreshKey]);
  return statuts;
}

function DashboardPage({ prenom, logements, statuts, onNavigate, onOpenAjout, refs }) {
  const aFaire = logements.filter(l => {
    const s = statuts[l.id];
    return s && !s.loading && !s.erreur && s.dateDepart && s.dateDepart <= todayISO();
  });
  const totalItems = logements.reduce((acc, l) => acc + (l.checklist_items?.length || 0), 0);
  const totalCoches = logements.reduce((acc, l) => {
    const s = statuts[l.id];
    return acc + (l.checklist_status || []).filter(cs => cs.checkout_date === s?.dateDepart && cs.coche).length;
  }, 0);
  const reassortAlertes = logements.reduce((acc, l) => acc + (l.reassort_items || []).filter(r => r.niveau <= 45).length, 0);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 48px' }}>
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 5, textTransform: 'capitalize' }}>{formatDateLong()}</div>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Bonjour, {prenom || 'toi'}</h1>
          </div>
          <PressableCircle onClick={() => onNavigate('profil')}>{(prenom || '?')[0]?.toUpperCase()}</PressableCircle>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <div ref={refs?.hero} style={{ background: INK, borderRadius: 28, padding: 'clamp(28px, 5vw, 40px)', marginBottom: 16, color: '#fff' }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Aujourd'hui</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(56px, 11vw, 80px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}><AnimatedNumber value={aFaire.length} /></span>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>appartement{aFaire.length > 1 ? 's' : ''} à préparer<br />sur {logements.length} au total</span>
          </div>
          {aFaire.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '24px 0 18px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aFaire.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{l.nom}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                      {statuts[l.id]?.dateProchaineArrivee ? `Prochain départ : ${formatDate(statuts[l.id].dateProchaineArrivee)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
          {[
            { n: logements.length, label: 'Logements' },
            { n: `${totalCoches}/${totalItems}`, label: 'Tâches faites' },
            { n: reassortAlertes, label: 'À réassortir' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em' }}>{s.n}</div>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={220}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tes logements</span>
          <span style={{ fontSize: 13, color: MUTED }}>{logements.length}</span>
        </div>
      </Reveal>
      <div style={{ background: '#fff', borderRadius: 20, padding: 6, border: `1px solid ${LINE}`, marginBottom: 30 }}>
        {logements.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: MUTED, fontSize: 13.5 }}>Aucun appartement pour l'instant.</div>}
        {logements.map((l, i) => {
          const s = statuts[l.id];
          const actif = s && !s.loading && !s.erreur && s.dateDepart && s.dateDepart <= todayISO();
          return (
            <Reveal key={l.id} delay={260 + i * 70}>
              <div onClick={() => onNavigate('logements')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '17px 16px', borderRadius: 16, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <StatusDot actif={actif} />
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 600 }}>{l.nom}</div>
                    <div style={{ fontSize: 13, color: MUTED, marginTop: 1 }}>
                      {!s ? 'Chargement…' : s.loading ? 'Lecture…' : s.erreur ? s.erreur : actif ? `Départ ${formatDate(s.dateDepart)}` : s.dateProchaineArrivee ? `Prochain : ${formatDate(s.dateProchaineArrivee)}` : 'Aucune réservation'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 980, background: actif ? INK : '#fff', color: actif ? '#fff' : INK, border: actif ? 'none' : `1.5px solid ${LINE}` }}>
                  {actif ? 'À faire' : 'Prêt'}
                </span>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={520}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, padding: '0 4px' }}>Raccourcis</div>
      </Reveal>
      <div ref={refs?.raccourcis} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <ShortcutTile icon={Icons.logements} label="Logements" delay={560} onClick={() => onNavigate('logements')} />
        <ShortcutTile icon={Icons.checklist} label="Checklists" badge={aFaire.length} delay={600} onClick={() => onNavigate('checklist')} />
        <ShortcutTile icon={Icons.reassort} label="Réassort" badge={reassortAlertes} delay={640} onClick={() => onNavigate('reassort')} />
        <ShortcutTile icon={Icons.profil} label="Profil" delay={680} onClick={() => onNavigate('profil')} />
      </div>

      <Reveal delay={720}>
        <button ref={refs?.ajouter} onClick={onOpenAjout} style={{ width: '100%', padding: '17px', borderRadius: 18, border: `1.5px dashed ${LINE}`, background: 'transparent', color: MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Ajouter un appartement
        </button>
      </Reveal>
    </div>
  );
}

function LogementCard({ l, statut, index }) {
  const [hover, setHover] = useState(false);
  const actif = statut && !statut.loading && !statut.erreur && statut.dateDepart && statut.dateDepart <= todayISO();
  const total = l.checklist_items?.length || 0;
  const done = (l.checklist_status || []).filter(cs => cs.checkout_date === statut?.dateDepart && cs.coche).length;
  return (
    <Reveal delay={100 + index * 90}>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
        background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 20, padding: '18px 20px', marginBottom: 12,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hover ? '0 10px 24px -16px rgba(0,0,0,0.15)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot actif={actif} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{l.nom}</span>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 13px', borderRadius: 980, background: actif ? INK : '#fff', color: actif ? '#fff' : INK, border: actif ? 'none' : `1.5px solid ${LINE}` }}>
            {!statut || statut.loading ? '…' : statut.erreur ? '—' : actif ? 'À faire' : 'Prêt'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 22 }}>
            <div>
              <div style={{ fontSize: 10.5, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Départ</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{actif ? formatDate(statut.dateDepart) : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Prochaine arrivée</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{statut?.dateProchaineArrivee ? formatDate(statut.dateProchaineArrivee) : '—'}</div>
            </div>
          </div>
          <ProgressRing done={done} total={total} />
        </div>
      </div>
    </Reveal>
  );
}

function LogementsPage({ logements, statuts, onOpenAjout, onBack }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px 48px' }}>
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '18px 0 22px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Tes logements</h1>
        <span style={{ fontSize: 13.5, color: MUTED }}>{logements.length} au total</span>
      </div>
      {logements.length === 0 && <EmptyState onOpenAjout={onOpenAjout} />}
      {logements.map((l, i) => <LogementCard key={l.id} l={l} statut={statuts[l.id]} index={i} />)}
      <Reveal delay={100 + logements.length * 90 + 40}>
        <button onClick={onOpenAjout} style={{ width: '100%', marginTop: 6, padding: '17px', borderRadius: 18, border: `1.5px dashed ${LINE}`, background: 'transparent', color: MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Ajouter un appartement
        </button>
      </Reveal>
    </div>
  );
}

function Checkbox({ done, onClick, disabled }) {
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      width: 23, height: 23, borderRadius: 7, border: `1.6px solid ${done ? INK : LINE}`, background: done ? INK : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.18s ease',
    }}>
      {done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
    </div>
  );
}

function ChecklistCard({ l, statut, index, onToggle, onAddItem }) {
  const [nouvelItem, setNouvelItem] = useState('');
  const checkoutDate = statut?.dateDepart;
  const actif = statut && !statut.loading && !statut.erreur && checkoutDate && checkoutDate <= todayISO();
  const items = l.checklist_items || [];
  const itemsCoches = (l.checklist_status || []).filter(s => s.checkout_date === checkoutDate);
  const estCoche = (itemId) => itemsCoches.some(s => s.checklist_item_id === itemId && s.coche);
  const done = items.filter(i => estCoche(i.id)).length;

  return (
    <Reveal delay={100 + index * 100}>
      <div style={{ background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 22, padding: '20px 22px', marginBottom: 16, opacity: actif ? 1 : 0.6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{l.nom}</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{actif ? `${done}/${items.length} tâches faites` : "Pas de ménage prévu aujourd'hui"}</div>
          </div>
          <ProgressRing done={done} total={items.length} />
        </div>
        {items.length === 0 && <div style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>Aucune tâche — ajoute la première ci-dessous.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Checkbox done={estCoche(item.id)} disabled={!actif} onClick={() => onToggle(l.id, item.id, checkoutDate, !estCoche(item.id))} />
              <span style={{ fontSize: 14.5, color: estCoche(item.id) ? MUTED : INK, textDecoration: estCoche(item.id) ? 'line-through' : 'none' }}>{item.libelle}</span>
            </div>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (nouvelItem.trim()) { onAddItem(l.id, nouvelItem.trim()); setNouvelItem(''); } }} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input value={nouvelItem} onChange={e => setNouvelItem(e.target.value)} placeholder="Ajouter une tâche" style={{ flex: 1, padding: '10px 13px', borderRadius: 10, border: `1.5px solid ${LINE}`, fontSize: 13.5, outline: 'none' }} />
          <button type="submit" style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: WARM, color: INK, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Ajouter</button>
        </form>
      </div>
    </Reveal>
  );
}

function ChecklistPage({ logements, statuts, onToggle, onAddItem, onOpenAjout, onBack }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px 48px' }}>
      <BackButton onClick={onBack} />
      <div style={{ margin: '18px 0 6px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Checklists</h1>
        <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 22 }}>Le détail précis de chaque appartement.</p>
      </div>
      {logements.length === 0 && <EmptyState onOpenAjout={onOpenAjout} />}
      {logements.map((l, i) => <ChecklistCard key={l.id} l={l} statut={statuts[l.id]} index={i} onToggle={onToggle} onAddItem={onAddItem} />)}
    </div>
  );
}

function getInfoNiveau(niveau) {
  if (niveau <= 15) return { mot: 'Vide', couleur: '#B8433A' };
  if (niveau <= 45) return { mot: 'Bientôt vide', couleur: '#C08A3D' };
  if (niveau <= 75) return { mot: 'Correct', couleur: '#7A9A4A' };
  return { mot: 'Plein', couleur: '#3F8F5C' };
}

function Jauge({ niveau, onChange }) {
  const { mot, couleur } = getInfoNiveau(niveau);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
      <div style={{ position: 'relative', flex: 1, height: 22, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 980, background: LINE, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${niveau}%`, background: couleur, borderRadius: 980, transition: 'width 0.15s ease, background 0.2s ease' }} />
        </div>
        <input type="range" min="0" max="100" value={niveau} onChange={e => onChange(Number(e.target.value))} style={{ position: 'relative', width: '100%', margin: 0, appearance: 'none', background: 'transparent', cursor: 'pointer' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: couleur, minWidth: 82, textAlign: 'right' }}>{mot}</span>
    </div>
  );
}

function ReassortBlock({ l, index, onChangeNiveau, onAddItem }) {
  const [nouvel, setNouvel] = useState('');
  const items = l.reassort_items || [];
  const alertes = items.filter(i => i.niveau <= 45).length;

  return (
    <Reveal delay={100 + index * 110}>
      <div style={{ background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 22, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{l.nom}</div>
          {items.length > 0 && (alertes > 0 ? (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 980, background: INK, color: '#fff' }}>{alertes} à surveiller</span>
          ) : (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 980, border: `1.5px solid ${LINE}`, color: INK }}>Tout est OK</span>
          ))}
        </div>
        {items.length === 0 && <div style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>Aucun produit suivi — ajoute-en un ci-dessous.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, minWidth: 90 }}>{item.label}</span>
              <Jauge niveau={item.niveau} onChange={(v) => onChangeNiveau(item.id, v)} />
            </div>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (nouvel.trim()) { onAddItem(l.id, nouvel.trim()); setNouvel(''); } }} style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <input value={nouvel} onChange={e => setNouvel(e.target.value)} placeholder="Ajouter un produit (ex: Café)" style={{ flex: 1, padding: '10px 13px', borderRadius: 10, border: `1.5px solid ${LINE}`, fontSize: 13.5, outline: 'none' }} />
          <button type="submit" style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: WARM, color: INK, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Ajouter</button>
        </form>
      </div>
    </Reveal>
  );
}

function ReassortPage({ logements, onChangeNiveau, onAddItem, onOpenAjout, onBack }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px 48px' }}>
      <BackButton onClick={onBack} />
      <div style={{ margin: '18px 0 6px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Réassort</h1>
        <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 22 }}>Ce qu'il faut racheter, appartement par appartement.</p>
      </div>
      {logements.length === 0 && <EmptyState onOpenAjout={onOpenAjout} />}
      {logements.map((l, i) => <ReassortBlock key={l.id} l={l} index={i} onChangeNiveau={(itemId, v) => onChangeNiveau(l.id, itemId, v)} onAddItem={onAddItem} />)}
    </div>
  );
}

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

function ProfilPage({ hoteInfo, logementsCount, onUpdateNom, onUpdatePassword, onBack }) {
  const [signingOut, setSigningOut] = useState(false);
  const [hoverPro, setHoverPro] = useState(false);

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
          <button style={{ width: '100%', padding: '13px', borderRadius: 980, border: 'none', background: '#fff', color: INK, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Passer à Pro</button>
        </div>
      </Reveal>

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

function App({ session }) {
  const [page, setPage] = useState('dashboard');
  const [logements, setLogements] = useState([]);
  const [hoteInfo, setHoteInfo] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showAjout, setShowAjout] = useState(false);
  const hoteId = session.user.id;
  const statuts = useStatuts(logements, 0);
  const tourRefs = { hero: useRef(null), raccourcis: useRef(null), ajouter: useRef(null) };

  async function chargerTout() {
    const [{ data: log }, { data: hote }] = await Promise.all([
      supabase.from('logements').select('*, checklist_items(*), checklist_status(*), reassort_items(*)').eq('hote_id', hoteId).order('created_at'),
      supabase.from('hotes').select('*').eq('id', hoteId).single(),
    ]);
    setLogements(log || []);
    setHoteInfo(hote);
    setLoaded(true);
  }

  useEffect(() => { chargerTout(); }, []);

  async function ajouterLogement(data) {
    const { error } = await supabase.from('logements').insert({ ...data, hote_id: hoteId });
    if (!error) { setShowAjout(false); chargerTout(); }
  }

  async function ajouterChecklistItem(logementId, libelle) {
    const { error } = await supabase.from('checklist_items').insert({ logement_id: logementId, libelle, ordre: 0 });
    if (!error) chargerTout();
  }

  async function toggleChecklist(logementId, itemId, checkoutDate, coche) {
    const { error } = await supabase.from('checklist_status').upsert(
      { logement_id: logementId, checklist_item_id: itemId, checkout_date: checkoutDate, coche, updated_at: new Date().toISOString() },
      { onConflict: 'checklist_item_id,checkout_date' }
    );
    if (!error) chargerTout();
  }

  async function ajouterReassortItem(logementId, label) {
    const { error } = await supabase.from('reassort_items').insert({ logement_id: logementId, label, niveau: 100 });
    if (!error) chargerTout();
  }

  async function changerNiveauReassort(logementId, itemId, niveau) {
    setLogements(prev => prev.map(l => l.id !== logementId ? l : {
      ...l, reassort_items: (l.reassort_items || []).map(it => it.id !== itemId ? it : { ...it, niveau }),
    }));
    await supabase.from('reassort_items').update({ niveau }).eq('id', itemId);
  }

  async function updateNom(nom) {
    await supabase.from('hotes').update({ nom }).eq('id', hoteId);
    chargerTout();
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    return !error;
  }

  async function marquerGuideVu() {
    setHoteInfo(prev => prev ? { ...prev, guide_vu: true } : prev);
    await supabase.from('hotes').update({ guide_vu: true }).eq('id', hoteId);
  }

  const prenom = hoteInfo?.nom?.split(' ')[0];

  return (
    <div style={{ minHeight: '100vh', background: WARM, fontFamily: 'Inter, sans-serif', color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes pulseDot { 0% { transform: scale(0.6); opacity: 0.25; } 100% { transform: scale(1.6); opacity: 0; } }
        input[type="range"] { -webkit-appearance: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid ${INK}; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
        input[type="range"]::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid ${INK}; cursor: pointer; }
      `}</style>

      {!loaded ? null : (
        <>
          {page === 'dashboard' && <DashboardPage prenom={prenom} logements={logements} statuts={statuts} onNavigate={setPage} onOpenAjout={() => setShowAjout(true)} refs={tourRefs} />}
          {page === 'logements' && <LogementsPage logements={logements} statuts={statuts} onOpenAjout={() => setShowAjout(true)} onBack={() => setPage('dashboard')} />}
          {page === 'checklist' && <ChecklistPage logements={logements} statuts={statuts} onToggle={toggleChecklist} onAddItem={ajouterChecklistItem} onOpenAjout={() => setShowAjout(true)} onBack={() => setPage('dashboard')} />}
          {page === 'reassort' && <ReassortPage logements={logements} onChangeNiveau={changerNiveauReassort} onAddItem={ajouterReassortItem} onOpenAjout={() => setShowAjout(true)} onBack={() => setPage('dashboard')} />}
          {page === 'profil' && <ProfilPage hoteInfo={hoteInfo} logementsCount={logements.length} onUpdateNom={updateNom} onUpdatePassword={updatePassword} onBack={() => setPage('dashboard')} />}
        </>
      )}

      {loaded && hoteInfo && !hoteInfo.guide_vu && page === 'dashboard' && (
        <OnboardingGuide onFinish={marquerGuideVu} onOpenAjout={() => setShowAjout(true)} refs={tourRefs} />
      )}

      {showAjout && <AjouterLogementModal onClose={() => setShowAjout(false)} onSave={ajouterLogement} />}
    </div>
  );
}

export default function Root() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  return session ? <App session={session} /> : <AuthScreen />;
}
