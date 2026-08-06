import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CharacterRadarChart from '@/components/RadarChart';
import { Globe, Book, Tag, BarChart2 } from 'lucide-react';
import StoryCard from '@/components/StoryCard';

async function getCharacter(id: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/share/character/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const character = await getCharacter(id);
  if (!character) return { title: 'Character Not Found' };
  return {
    title: `${character.name} — OC Creator`,
    description: character.bio || `View ${character.name}'s character sheet`,
    openGraph: {
      title: character.name,
      description: character.bio || `OC by ${character.creatorName}`,
      images: character.imageUrl ? [{ url: character.imageUrl }] : [],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: character.name },
  };
}

export default async function PublicCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = await getCharacter(id);
  if (!character) notFound();

  const extra = character.statsJSON || {};
  const stories = extra.stories || [];

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem',
          background: character.imageUrl ? `url(${character.imageUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
          height: 280, position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.95), rgba(10,10,15,0.3))' }} />
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.75rem', right: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-public" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={14} /> Public</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900 }}>{character.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              by <a href={`/profile/${character.creatorUid}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{character.creatorName}</a>
            </p>
          </div>
        </div>

        <div className="layout-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {character.bio && (
              <div className="glass" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Book size={16} /> Biography</h2>
                <p style={{ lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{character.bio}</p>
              </div>
            )}

            {extra.personality && (
              <div className="glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Personality</h3>
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
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={16} /> Radar Stats</h2>
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

        {/* Stories Section */}
        {stories.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Stories
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stories.map((story: any) => (
                <StoryCard key={story.id} story={story} targetId={id} type="character" />
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.75rem', marginTop: '3rem' }}>
          Shared via <a href="/" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>OC Creator</a>
        </p>
      </div>
    </main>
  );
}
