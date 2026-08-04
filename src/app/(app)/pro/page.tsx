'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, FolderOpen, Users } from 'lucide-react';
import UniverseCard from '@/components/UniverseCard';
import CharacterCard from '@/components/CharacterCard';
import { useLocale } from '@/store/useLocale';

export default function ProDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  const [universes, setUniverses] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'universes' | 'characters'>('universes');

  useEffect(() => {
    if (session) {
      const role = (session.user as any).role?.toLowerCase();
      if (role !== 'pro' && role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      Promise.all([
        fetch('/api/pro/universes').then(r => r.json()),
        fetch('/api/pro/characters').then(r => r.json())
      ]).then(([uniData, charData]) => {
          setUniverses(Array.isArray(uniData) ? uniData : []);
          setCharacters(Array.isArray(charData) ? charData : []);
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

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('universes')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'universes' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'universes' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <FolderOpen size={18} /> Universes ({universes.length})
        </button>
        <button 
          onClick={() => setActiveTab('characters')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'characters' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'characters' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <Users size={18} /> Characters ({characters.length})
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        {activeTab === 'universes' && (
          universes.length === 0 ? (
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
          )
        )}

        {activeTab === 'characters' && (
          characters.length === 0 ? (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p>No characters found on the platform yet.</p>
            </div>
          ) : (
            <div className="grid-cards">
              {characters.map((char) => (
                <CharacterCard key={char.id} character={char} hideDelete />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
