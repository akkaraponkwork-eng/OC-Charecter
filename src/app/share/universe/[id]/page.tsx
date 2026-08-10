import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Globe, Book, Users, Link as LinkIcon, Pencil } from 'lucide-react';
import Link from 'next/link';
import StoryCard from '@/components/StoryCard';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

async function getUniverse(id: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/share/universe/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const universe = await getUniverse(id);
  if (!universe) return { title: 'Universe Not Found' };
  return {
    title: `${universe.name} — OC Creator`,
    description: universe.description || `View ${universe.name}`,
    openGraph: {
      title: universe.name,
      description: universe.description || `Universe by ${universe.creatorName}`,
      images: universe.coverUrl ? [{ url: universe.coverUrl }] : [],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: universe.name },
  };
}

export default async function PublicUniversePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const universe = await getUniverse(id);
  if (!universe) notFound();

  const session = await auth();
  const uid = (session?.user as any)?.uid;
  const isAdmin = (session?.user as any)?.role === 'admin';
  const isOwner = uid === universe.creatorUid;
  
  let isCollaborator = false;
  if (uid && !isOwner && !isAdmin) {
    try {
      const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
      const collabRows = await collabSheet.getCachedRows();
      isCollaborator = collabRows.some(
        (r) => r.get('universeId') === id && r.get('userId') === uid && r.get('status') === 'accepted'
      );
    } catch(e) {}
  }
  const canEdit = isOwner || isAdmin || isCollaborator;

  const stories = universe.stories || [];
  const characters = universe.characters || [];

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem',
          background: universe.coverUrl ? `url(${universe.coverUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
          height: 280, position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.95), rgba(10,10,15,0.3))' }} />
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.75rem', right: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-public" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={14} /> Public Universe</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900 }}>{universe.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              by <a href={`/profile/${universe.creatorUid}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{universe.creatorName}</a>
            </p>
            {canEdit && (
              <div style={{ marginTop: '1rem' }}>
                <Link href={`/universes/${id}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  <Pencil size={16} /> เข้าสู่โหมดจัดการจักรวาล (Manage Universe)
                </Link>
              </div>
            )}
          </div>
        </div>

        {universe.description && (
          <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <p style={{ lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{universe.description}</p>
          </div>
        )}

        {/* Stories Section */}
        {stories.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Book size={20} /> Stories
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stories.map((story: any) => (
                <StoryCard key={story.id} story={story} targetId={id} type="universe" />
              ))}
            </div>
          </div>
        )}

        {/* Characters Section */}
        {characters.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Characters
            </h2>
            <div className="grid-cards">
              {characters.map((c: any) => (
                <Link key={c.id} href={`/share/character/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass card-hover" style={{ overflow: 'hidden', height: '100%' }}>
                    <div style={{
                      height: 200, background: c.imageUrl
                        ? `url(${c.imageUrl}) center/cover`
                        : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))',
                      position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9), transparent 60%)' }} />
                      <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{c.name}</h3>
                        {c.tags && c.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {c.tags.slice(0, 3).map((tag: string) => (
                              <span key={tag} style={{
                                background: 'rgba(124,58,237,0.3)', color: '#c4b5fd',
                                padding: '0.1rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem',
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {c.bio && (
                      <div style={{ padding: '0.875rem' }}>
                        <p style={{
                          color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>{c.bio}</p>
                      </div>
                    )}
                  </div>
                </Link>
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
