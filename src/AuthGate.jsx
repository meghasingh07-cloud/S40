import React, { useEffect, useState } from 'react';
import './AuthGate.css';

const DEMO_EMAIL = 'demo@fraudshield.local';
const DEMO_PASSWORD = 'Demo@12345';

function clearAuth() {
  ['token', 'fraudshield-token', 'authToken', 'accessToken', 'fraudshield-user'].forEach(k => localStorage.removeItem(k));
}

export default function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [name, setName] = useState('Demo User');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { clearAuth(); }, []);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      if (mode === 'register') {
        setMode('login'); setPassword(''); setError('Account created. Sign in with your new password.');
      } else {
        localStorage.setItem('token', data.token); localStorage.setItem('fraudshield-user', JSON.stringify(data.user)); onAuthenticated(data.user);
      }
    } catch (e) { setError(e.message || 'Authentication failed'); }
    finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand-panel">
          <div className="auth-brand"><span className="auth-shield">🛡️</span><span>Fraud<span>Shield</span></span></div>
          <div className="auth-kicker">PAYMENT SAFETY INTELLIGENCE</div>
          <h2>Protect every payment<br />before it happens.</h2>
          <p>JWT-secured access to behavioural risk analysis, automatic Call Guard, scam-chain detection and payment approval.</p>
          <div className="auth-points"><span>✓ Personal transaction baseline</span><span>✓ Automatic multi-model AI analysis</span><span>✓ Pending approval for elevated risk</span></div>
        </section>
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-top"><div><div className="eyebrow">SECURE ACCESS</div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'login' ? 'Sign in to open your protected FraudShield dashboard.' : 'Create a protected local FraudShield account.'}</p></div><div className="auth-mini-shield">✓</div></div>
          {mode === 'register' && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>}
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" required autoComplete="email" /></label>
          <label>Password<div className="password-wrap"><input value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" type={showPassword ? 'text' : 'password'} minLength={8} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
          {mode === 'login' && <div className="demo-hint"><strong>Demo account</strong><span>{DEMO_EMAIL}</span><span>{DEMO_PASSWORD}</span></div>}
          {error && <div className={`auth-message ${error.toLowerCase().includes('created') ? 'success' : ''}`}>{error}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Authenticating…' : mode === 'login' ? 'Sign in securely' : 'Create protected account'}</button>
          <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create a new account' : 'Already have an account? Sign in'}</button>
          <div className="auth-footer"><span>JWT authentication</span><span>•</span><span>Local encrypted-password database</span></div>
        </form>
      </div>
    </main>
  );
}
