'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, FolderOpen } from 'lucide-react';
import UniverseCard from '@/components/UniverseCard';
import { useLocale } from '@/store/useLocale';

export default function ProDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  const [universes, setUniverses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      const role = (session.user as any).role?.toLowerCase();
      if (role !== 'pro' && role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      fetch('/api/pro/universes')
        .then(r => r.json())
        .then(data => {
          setUniverses(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session, router]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={24} color="var(--primary-light)" /> Pro Hub
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Explore all universes across the platform.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderOpen size={20} /> All Universes ({universes.length})
        </h2>
        
        {universes.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FolderOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No universes found on the platform yet.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {universes.map((uni) => (
              <UniverseCard key={uni.id} universe={uni} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
