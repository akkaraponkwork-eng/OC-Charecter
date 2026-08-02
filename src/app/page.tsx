'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/store/useLocale';

export default function LoginPage() {
  const { t, locale, toggleLocale } = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', {
      username, password, redirect: false,
    });
    setLoading(false);
    if (result?.error) setError(t('auth.invalidCredentials'));
    else router.push('/dashboard');
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Language toggle */}
      <button
        onClick={toggleLocale}
        style={{
          position: 'fixed', top: '1.25rem', right: '1.5rem',
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          color: 'var(--text-muted)', padding: '0.4rem 0.9rem',
          borderRadius: '99px', cursor: 'pointer', fontSize: '0.8rem',
          fontWeight: 600, letterSpacing: 1, zIndex: 10,
        }}
      >
        {locale === 'th' ? 'EN' : 'TH'}
      </button>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo/Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            marginBottom: '1rem', fontSize: '2rem',
            boxShadow: '0 0 40px var(--primary-glow)',
          }}>✦</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            <span className="gradient-text">OC Creator</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('auth.tagline')}</p>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          {/* Google Login */}
          <button
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? t('auth.loggingIn') : t('auth.signInGoogle')}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {locale === 'th' ? 'หรือ' : 'or'}
            </span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">{t('auth.username')}</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? (
                <><div className="spinner" />{t('auth.loggingIn')}</>
              ) : t('auth.signInCredentials')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          OC Creator · Original Character Studio
        </p>
      </div>
    </main>
  );
}
