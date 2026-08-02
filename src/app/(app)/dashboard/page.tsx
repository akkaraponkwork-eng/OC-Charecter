'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/store/useLocale';
import { useStore } from '@/store/useStore';
import UniverseCard from '@/components/UniverseCard';
import CreateUniverseModal from '@/components/CreateUniverseModal';
import { FolderOpen, Users, Handshake, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const { universes, setUniverses, addUniverse } = useStore();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const user = session?.user as any;

  useEffect(() => {
    fetch('/api/universes')
      .then((r) => r.json())
      .then((data) => { setUniverses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span suppressHydrationWarning>{t('auth.welcomeBack')}</span> <span className="gradient-text">{user?.name || user?.username}</span> <Sparkles className="gradient-text" size={24} />
        </h1>
        <p suppressHydrationWarning style={{ color: 'var(--text-muted)' }}>{t('dashboard.title')}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: t('dashboard.universes'), value: universes.length, icon: <FolderOpen size={24} /> },
          { label: t('dashboard.characters'), value: '—', icon: <Users size={24} /> },
          { label: t('dashboard.collaborations'), value: universes.filter((u: any) => u.isCollaborator).length, icon: <Handshake size={24} /> },
        ].map((stat) => (
          <div key={stat.label} className="glass-sm" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            <div suppressHydrationWarning style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Universes grid */}
      <div className="section-header">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderOpen size={18} /> <span suppressHydrationWarning>{t('dashboard.title')}</span>
        </h2>
        <button suppressHydrationWarning className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
          {t('dashboard.createUniverse')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <span suppressHydrationWarning>{t('common.loading')}</span>
        </div>
      ) : universes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)',
          color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <FolderOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p suppressHydrationWarning style={{ marginBottom: '1.5rem' }}>{t('dashboard.noUniverses')}</p>
          <button suppressHydrationWarning className="btn-primary" onClick={() => setShowCreate(true)}>
            {t('dashboard.createUniverse')}
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {universes.map((u: any) => (
            <UniverseCard key={u.id} universe={u} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateUniverseModal
          onClose={() => setShowCreate(false)}
          onCreated={(u) => addUniverse(u)}
        />
      )}
    </div>
  );
}
