'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/store/useLocale';
import { Mail, Check, X } from 'lucide-react';

export default function InvitationsPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const router = useRouter();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = () => {
    fetch('/api/invitations').then(r => r.json()).then(data => {
      setInvitations(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: 'accept' | 'decline', type: 'universe' | 'friend' = 'universe') => {
    setProcessing(id);
    
    if (type === 'friend') {
      await fetch('/api/friends/requests', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderUid: id, action }),
      });
    } else {
      await fetch(`/api/invitations/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    }
    
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    setProcessing(null);
    if (action === 'accept') router.refresh();
  };

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Mail size={24} /> <span suppressHydrationWarning>{t('invitations.title')}</span>
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : invitations.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Mail size={48} color="var(--text-muted)" /></div>
          <p suppressHydrationWarning style={{ color: 'var(--text-muted)' }}>{t('invitations.noInvitations')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {invitations.map((inv) => (
            <div key={inv.id} className="glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: inv.inviterAvatar ? `url(${inv.inviterAvatar}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 700, color: 'white', cursor: inv.type === 'friend' ? 'pointer' : 'default'
                }}
                onClick={() => inv.type === 'friend' && router.push(`/share/character/${inv.inviterUsername}`)}
              >
                {!inv.inviterAvatar && inv.inviterName[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  <span 
                    style={{ color: 'var(--primary-light)', cursor: inv.type === 'friend' ? 'pointer' : 'default' }}
                    onClick={() => inv.type === 'friend' && router.push(`/share/character/${inv.inviterUsername}`)}
                  >
                    {inv.inviterName}
                  </span>
                  {' '}
                  {inv.type === 'friend' ? (
                    'sent you a friend request'
                  ) : (
                    <>invited you to join <span style={{ color: 'var(--accent)' }}>{inv.universeName}</span></>
                  )}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {new Date(inv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  disabled={processing === inv.id}
                  onClick={() => handleAction(inv.id, 'decline', inv.type)}
                ><X size={16} /> <span suppressHydrationWarning>{t('invitations.decline')}</span></button>
                <button
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  disabled={processing === inv.id}
                  onClick={() => handleAction(inv.id, 'accept', inv.type)}
                ><Check size={16} /> <span suppressHydrationWarning>{t('invitations.accept')}</span></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
