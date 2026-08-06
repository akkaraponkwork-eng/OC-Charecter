'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/store/useToast';

interface Story {
  id: string;
  title: string;
  description: string;
  isLocked: boolean;
}

export default function StoryCard({ story, targetId, type, isOwner = false, collapsible = true }: { story: Story, targetId: string, type: 'universe' | 'character', isOwner?: boolean, collapsible?: boolean }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedDescription, setRevealedDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReveal = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click navigation
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    if (revealedDescription) {
      setIsRevealed(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/${type === 'universe' ? 'universes' : 'characters'}/${targetId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      let foundStory;
      if (type === 'universe') {
        foundStory = data.stories?.find((s: any) => s.id === story.id);
      } else {
        foundStory = data.statsJSON?.stories?.find((s: any) => s.id === story.id);
      }

      if (foundStory) {
        setRevealedDescription(foundStory.description);
        setIsRevealed(true);
      } else {
        showToast('Story not found in data', 'error');
      }
    } catch (e: any) {
      showToast('Error revealing story', 'error');
    }
    setLoading(false);
  };

  const handleClick = () => {
    if (story.isLocked && !isOwner && !isAdmin) {
      showToast('This story is locked by the creator.', 'error');
      return;
    }
    const isShare = pathname.startsWith('/share');
    const typePath = type === 'universe' ? (isShare ? 'universe' : 'universes') : (isShare ? 'character' : 'characters');
    const prefix = isShare ? '/share' : '';
    router.push(`${prefix}/${typePath}/${targetId}/story/${story.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        background: 'var(--glass)', 
        border: '1px solid var(--glass-border)', 
        borderRadius: 'var(--radius-md)', 
        padding: '1.25rem',
        cursor: (story.isLocked && !isOwner && !isAdmin) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease'
      }}
      className={(!story.isLocked || isOwner || isAdmin) ? "card-hover" : ""}
    >
      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: (story.isLocked && !isOwner && !isAdmin) ? 'var(--text-muted)' : 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {story.title}
          {story.isLocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.8rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                <Lock size={12} /> Locked
              </span>
              {isAdmin && (
                <button 
                  onClick={handleReveal}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                  title="Admin: Reveal story"
                >
                  {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : (isRevealed ? <EyeOff size={16} /> : <Eye size={16} />)}
                </button>
              )}
            </div>
          )}
        </div>
        
        {(!story.isLocked || isOwner || isAdmin) && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Click to read full story
          </span>
        )}
      </h4>

      {isRevealed && revealedDescription && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '0.75rem', background: 'rgba(124,58,237,0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {revealedDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
