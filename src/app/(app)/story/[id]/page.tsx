'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Edit, Lock, Unlock, Map, Clock, Users, BookOpen, Settings } from 'lucide-react';
import { useLocale } from '@/store/useLocale';

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'timeline' | 'maps' | 'characters'>('chapters');
  const [error, setError] = useState('');
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load story');
        return r.json();
      })
      .then(data => {
        setStory(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  }

  if (error || !story) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{error || 'Story not found'}</div>;
  }

  const isAuthor = currentUser?.uid === story.authorId;
  const settings = story.settings || {};

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/users" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} /> กลับไปที่คอมมูนิตี้
        </Link>
        {isAuthor && (
          <Link href={`/story/${id}/edit`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '99px', textDecoration: 'none' }}>
            <Settings size={16} /> ตั้งค่า
          </Link>
        )}
      </div>

      {/* Hero Section */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem' }}>
        {story.coverImage ? (
          <div style={{ width: '100%', height: '300px', backgroundImage: `url(${story.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div style={{ width: '100%', height: '150px', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} />
        )}
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0' }}>{story.title}</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
            {story.description || 'ไม่มีคำอธิบาย'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {settings.enableChapters !== false && (
          <button 
            onClick={() => setActiveTab('chapters')} 
            style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'chapters' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'chapters' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <BookOpen size={18} /> เนื้อเรื่อง ({story.chapters?.length || 0})
          </button>
        )}
        {settings.enableTimeline !== false && (
          <button 
            onClick={() => setActiveTab('timeline')} 
            style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'timeline' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'timeline' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Clock size={18} /> ไทม์ไลน์
          </button>
        )}
        {settings.enableMaps !== false && (
          <button 
            onClick={() => setActiveTab('maps')} 
            style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'maps' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'maps' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Map size={18} /> แผนที่
          </button>
        )}
        {settings.enableRelationships !== false && (
          <button 
            onClick={() => setActiveTab('characters')} 
            style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'characters' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'characters' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Users size={18} /> ตัวละคร
          </button>
        )}
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'chapters' && (
          <div>
            {isAuthor && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '99px' }}>+ เพิ่มตอนใหม่</button>
              </div>
            )}
            
            {(!story.chapters || story.chapters.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--glass)', borderRadius: 'var(--radius)' }}>
                ยังไม่มีเนื้อเรื่อง
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {story.chapters.map((ch: any) => (
                  <div key={ch.id} className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {ch.isLocked ? <Lock size={16} className="text-primary" /> : <Unlock size={16} className="text-success" />}
                        {ch.title}
                      </h3>
                      {isAuthor && (
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>แก้ไข</button>
                      )}
                    </div>
                    {ch.isLocked && !isAuthor ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius)' }}>
                        <Lock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>เนื้อหานี้ถูกล็อคโดยผู้แต่ง</p>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{ch.content}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--glass)', borderRadius: 'var(--radius)' }}>
            ระบบไทม์ไลน์กำลังอยู่ในระหว่างการพัฒนา...
          </div>
        )}

        {activeTab === 'maps' && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--glass)', borderRadius: 'var(--radius)' }}>
            ระบบแผนที่ภูมิประเทศกำลังอยู่ในระหว่างการพัฒนา...
          </div>
        )}

        {activeTab === 'characters' && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--glass)', borderRadius: 'var(--radius)' }}>
            ระบบความสัมพันธ์ตัวละครกำลังอยู่ในระหว่างการพัฒนา...
          </div>
        )}
      </div>
    </div>
  );
}
