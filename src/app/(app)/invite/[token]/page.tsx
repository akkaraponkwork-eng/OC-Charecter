'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { use } from 'react';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [universeName, setUniverseName] = useState('a universe');

  useEffect(() => {
    fetch(`/api/invite/${token}`).then(r => r.json()).then(data => {
      if (data.name) setUniverseName(data.name);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/invite/${token}`);
    }
  }, [status, router, token]);

  const handleAccept = async () => {
    setLoading(true); setError('');
    const res = await fetch(`/api/invite/${token}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push(`/universes/${token}`), 1500);
    } else {
      setError(data.error);
      setLoading(false);
    }
  };

  if (status === 'loading') return <div style={{ textAlign: 'center', padding: '5rem' }}><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 500, margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
          <Mail size={32} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>You've been invited!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          You have received an invitation link to collaborate on <strong>{universeName}</strong>.
        </p>
        
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        
        {success ? (
          <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '1rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <Check size={16} /> Joined successfully! Redirecting...
          </div>
        ) : (
          <button className="btn-primary" style={{ width: '100%', padding: '0.875rem' }} onClick={handleAccept} disabled={loading}>
            {loading ? <div className="spinner" style={{ margin: '0 auto' }} /> : 'Accept Invitation'}
          </button>
        )}
      </div>
    </div>
  );
}
