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

  const togglePublic = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newVal = !universe.isPublic;
    await fetch(`/api/universes/${universe.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: newVal }),
    });
    updateUniverse(universe.id, { isPublic: newVal });
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
            <span className={`badge ${universe.isPublic ? 'badge-public' : 'badge-private'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {universe.isPublic ? <Globe size={12} /> : <Lock size={12} />}
              {universe.isPublic ? t('common.public') : t('common.private')}
            </span>
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
              <button className="btn-secondary" style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                onClick={togglePublic}>
                {universe.isPublic ? <Lock size={14} /> : <Globe size={14} />} 
                {universe.isPublic ? t('universe.makePrimitive') : t('universe.sharePublic')}
              </button>
              <button className="btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
