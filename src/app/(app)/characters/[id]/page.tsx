'use client';
import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CharacterRadarChart from '@/components/RadarChart';
import CharacterFormModal from '@/components/CharacterFormModal';
import { Globe, Book, Tag, BarChart2, Lock, Pencil, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/store/useLocale';

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const uid = (session?.user as any)?.uid;
  const isAdmin = (session?.user as any)?.role === 'admin';

  const loadCharacter = async () => {
    try {
      const res = await fetch(`/api/characters/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.replace('/characters');
        return;
      }
      const data = await res.json();
      setCharacter(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCharacter();
  }, [id]);

  const handleSaveCharacter = async (data: any) => {
    const res = await fetch(`/api/characters/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowEdit(false);
      loadCharacter(); // Reload updated data
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  }

  if (!character) return null;

  const isOwner = character.userId === uid;
  const extra = character.statsJSON || {};
  const stories = extra.stories || [];

  return (
    <div className="page-container" style={{ padding: '0 1.5rem 3rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Top Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '1rem' }}>
          <button onClick={() => router.back()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          {isOwner && (
            <button onClick={() => setShowEdit(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              <Pencil size={16} /> Edit Character
            </button>
          )}
        </div>

        <div style={{
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem',
          background: character.imageUrl ? `url(${character.imageUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
          height: 280, position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.95), rgba(10,10,15,0.3))' }} />
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.75rem', right: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {character.isPublic ? (
                <span className="badge badge-public" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={14} /> {t('character.public')}</span>
              ) : (
                <span className="badge badge-private" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Lock size={14} /> {t('character.private')}</span>
              )}
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900 }}>{character.name}</h1>
          </div>
        </div>

        <div className="layout-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {character.bio && (
              <div className="glass" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Book size={16} /> {t('character.biography')}</h2>
                <p style={{ lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{character.bio}</p>
              </div>
            )}

            {extra.personality && (
              <div className="glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{t('character.personality')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{extra.personality}</p>
              </div>
            )}

            {character.tags?.length > 0 && (
              <div className="glass" style={{ padding: '1.25rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Tag size={16} /> Tags</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {character.tags.map((tag: string) => (
                    <span key={tag} style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid rgba(124,58,237,0.3)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {(extra.age || extra.gender || extra.height || extra.weight) && (
              <div className="glass" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                {extra.age && <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Age</div><div style={{ fontWeight: 600 }}>{extra.age}</div></div>}
                {extra.gender && <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender</div><div style={{ fontWeight: 600 }}>{extra.gender}</div></div>}
                {extra.height && <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Height</div><div style={{ fontWeight: 600 }}>{extra.height}</div></div>}
                {extra.weight && <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight</div><div style={{ fontWeight: 600 }}>{extra.weight}</div></div>}
              </div>
            )}

            {extra.radar?.stats && (
              <div className="glass" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={16} /> {t('character.radarStats')}</h2>
                <div style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
                  <CharacterRadarChart 
                    stats={extra.radar.stats.reduce((acc: any, curr: any) => { 
                      acc[curr.label || 'Unknown'] = { value: curr.value, breakLimit: curr.breakLimit }; 
                      return acc; 
                    }, {})} 
                    size={250} 
                    color={extra.radar.color} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stories Section (Shows all for owner, public for others) */}
        {stories.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {t('character.stories')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stories.map((story: any) => {
                const showLocked = !isOwner && !isAdmin && story.isLocked;
                return (
                  <div key={story.id} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', position: 'relative' }}>
                    {story.isLocked && (
                      <span style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '0.2rem 0.5rem', borderRadius: '99px' }}>
                        <Lock size={12} /> {t('character.locked')}
                      </span>
                    )}
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: showLocked ? 'var(--text-muted)' : 'var(--primary)', marginBottom: '0.5rem', paddingRight: '4rem' }}>{story.title}</h4>
                    {!showLocked ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {story.description}
                      </p>
                    ) : (
                      <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', opacity: 0.7, fontStyle: 'italic', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>This story is locked by the creator.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <CharacterFormModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleSaveCharacter}
        initialData={character}
      />
    </div>
  );
}
