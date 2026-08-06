'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FeaturedAvatarList from './FeaturedAvatarList';

interface Story {
  id: string;
  title: string;
  description: string;
  isLocked: boolean;
  charactersTitle?: string;
  characters?: { id: string, role?: string }[];
}

export default function StoryView({ targetId, storyId, type, isPublicShare = false }: { targetId: string, storyId: string, type: 'universe' | 'character', isPublicShare?: boolean }) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [universeChars, setUniverseChars] = useState<any[]>([]);

  useEffect(() => {
    if (type === 'universe') {
      fetch(`/api/characters?universeId=${targetId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUniverseChars(data);
        })
        .catch(console.error);
    }
  }, [targetId, type]);
  const { data: session } = useSession();

  useEffect(() => {
    const apiPath = isPublicShare ? `/api/share/${type}/${targetId}` : `/api/${type}s/${targetId}`;
    fetch(apiPath).then(res => res.json()).then(data => {
      let found;
      if (type === 'universe') {
        found = data.stories?.find((s: any) => s.id === storyId);
      } else {
        found = data.statsJSON?.stories?.find((s: any) => s.id === storyId);
      }
      setStory(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [targetId, storyId, type, isPublicShare]);

  if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }}/></div>;
  if (!story) return <div className="page-container"><p>Story not found or locked.</p></div>;

  return (
    <div className="page-container" style={{ maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <ChevronLeft size={20} /> Back
      </button>
      
      <div className="glass" style={{ padding: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {story.title}
          {story.isLocked && <span style={{ fontSize: '1rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Lock size={16}/> Locked</span>}
        </h1>
        
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-main)', paddingBottom: '2rem' }}>
          {story.description || <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>No description provided.</span>}
        </div>

        {story.characters && story.characters.length > 0 && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <FeaturedAvatarList 
              title={story.charactersTitle || 'ตัวละครในตอนนี้'}
              prefix={prefix}
              characters={story.characters.map((sc: any) => {
                const char = universeChars.find((c: any) => c.id === sc.id);
                return char ? { ...char, role: sc.role } : null;
              }).filter(Boolean)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
