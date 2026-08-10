'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderOpen, BookOpen } from 'lucide-react';
import { useLocale } from '@/store/useLocale';

export default function StoriesPage() {
  const { t } = useLocale();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stories', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setStories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stories', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={28} className="text-primary" /> สตอรี่ & สร้างโลก
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>ศูนย์รวมนิยายและโปรเจคสร้างโลกของทุกคน</p>
        </div>
        <Link href="/story/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '99px', padding: '0.75rem 1.5rem', fontWeight: 600 }}>
          <FolderOpen size={18} /> สร้างสตอรี่ใหม่
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)', background: 'var(--glass)', borderRadius: 'var(--radius-lg)' }}>
          <FolderOpen size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>ยังไม่มีเนื้อเรื่อง</h2>
          <p>ยังไม่มีใครสร้างสตอรี่เลย มาเริ่มแต่งเรื่องแรกกันเถอะ!</p>
        </div>
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {stories.map(story => (
            <Link href={`/story/${story.id}`} key={story.id} style={{ textDecoration: 'none' }}>
              <div className="glass card-hover" style={{ padding: '0', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {story.coverImage ? (
                  <div style={{ width: '100%', height: 180, backgroundImage: `url(${story.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--glass-border)' }} />
                ) : (
                  <div style={{ width: '100%', height: 180, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderBottom: '1px solid var(--glass-border)' }} />
                )}
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{story.title}</h3>
                  {story.description ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, lineHeight: 1.5 }}>
                      {story.description}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-subtle)', fontStyle: 'italic', margin: 0 }}>ไม่มีคำอธิบาย</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
