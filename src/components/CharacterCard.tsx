'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';
import { useLocale } from '@/store/useLocale';
import { Globe, Lock, Trash2 } from 'lucide-react';
import CharacterRadarChart from './RadarChart';

interface Character {
  id: string; userId: string; name: string; bio: string;
  imageUrl: string; tags: string[]; isPublic: boolean;
  statsJSON: any;
}

export default function CharacterCard({ character, showOwner, hideDelete }: { character: Character; showOwner?: boolean; hideDelete?: boolean }) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { removeCharacter } = useStore();
  const uid = (session?.user as any)?.uid;
  const isOwner = character.userId === uid;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(t('character.deleteConfirm'))) return;
    await fetch(`/api/characters/${character.id}`, { method: 'DELETE' });
    removeCharacter(character.id);
  };

  const topStats = Object.entries(character.statsJSON || {}).slice(0, 3);

  return (
    <Link href={isOwner ? `/characters/${character.id}` : `/share/character/${character.id}`} style={{ textDecoration: 'none' }}>
      <div className="glass card-hover" style={{ overflow: 'hidden', height: '100%' }}>
        {/* Image */}
        <div style={{
          height: 200, background: character.imageUrl
            ? `url(${character.imageUrl}) center/cover`
            : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9), transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{character.name}</h3>
            {character.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {character.tags.slice(0, 3).map((tag) => (
                  <span key={tag} style={{
                    background: 'rgba(124,58,237,0.3)', color: '#c4b5fd',
                    padding: '0.1rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0.875rem' }}>
          {character.bio && (
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              marginBottom: topStats.length > 0 ? '0.75rem' : 0,
            }}>{character.bio}</p>
          )}

          {/* Radar Chart */}
          {character.statsJSON?.radar?.stats && (
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ pointerEvents: 'none' }}>
                <CharacterRadarChart 
                  stats={character.statsJSON.radar.stats.reduce((acc: any, curr: any) => {
                    acc[curr.label || 'Unknown'] = { value: curr.value, breakLimit: curr.breakLimit };
                    return acc;
                  }, {})} 
                  size={130} 
                  color={character.statsJSON.radar.color} 
                />
              </div>
            </div>
          )}

          {isOwner && !hideDelete && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                className="btn-danger"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                onClick={handleDelete}
              ><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
