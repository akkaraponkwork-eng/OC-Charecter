'use client';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useLocale } from '@/store/useLocale';
import { useSession } from 'next-auth/react';
import { Lock, Globe, Trash2, Handshake } from 'lucide-react';

interface Universe {
  id: string; userId: string; name: string;
  description: string; coverUrl: string;
  isPublic: boolean; isCollaborator?: boolean;
}

export default function UniverseCard({ universe }: { universe: Universe }) {
  const { t } = useLocale();
  const { removeUniverse, updateUniverse } = useStore();
  const { data: session } = useSession();
  const uid = (session?.user as any)?.uid;
  const isOwner = universe.userId === uid;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(t('universe.deleteConfirm'))) return;
    await fetch(`/api/universes/${universe.id}`, { method: 'DELETE' });
    removeUniverse(universe.id);
  };

  return (
    <Link href={`/universes/${universe.id}`} style={{ textDecoration: 'none' }}>
      <div className="glass card-hover" style={{ overflow: 'hidden', height: '100%', cursor: 'pointer' }}>
        {/* Cover */}
        <div style={{
          height: 140, background: universe.coverUrl
            ? `url(${universe.coverUrl}) center/cover`
            : 'linear-gradient(135deg, var(--primary), var(--accent))',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,15,0.8), transparent)',
          }} />
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            {universe.isCollaborator && (
              <span className="badge badge-pending" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Handshake size={12} /> Collab
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '1rem' }}>{universe.name}</h3>
          {universe.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {universe.description}
            </p>
          )}

          {isOwner && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }} onClick={(e) => e.preventDefault()}>
              <button className="btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}
                onClick={handleDelete}>
                <Trash2 size={14} /> {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
