'use client';
import { useSession } from 'next-auth/react';
import { Lock, Eye } from 'lucide-react';
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
                <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', padding: '0.2rem' }} title="Admin can read">
                  <Eye size={16} />
                </div>
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
    </div>
  );
}
