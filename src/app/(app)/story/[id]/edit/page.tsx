'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Settings, List, Map, Clock, Users } from 'lucide-react';

export default function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [story, setStory] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if (currentUser?.uid !== data.authorId) {
          setError('Forbidden');
          setLoading(false);
          return;
        }
        setStory(data);
        setTitle(data.title);
        setDescription(data.description);
        setCoverImage(data.coverImage);
        setIsPublic(data.isPublic);
        setSettings(data.settings || { enableMaps: true, enableTimeline: true, enableChapters: true, enableRelationships: true });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, currentUser]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, coverImage, isPublic, settings })
      });
      if (res.ok) {
        router.push(`/story/${id}`);
      } else {
        alert('Failed to save settings');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสตอรี่นี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/users'); // Go back to community
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  if (error || !story) return <div style={{ textAlign: 'center', padding: '4rem' }}>{error || 'Story not found'}</div>;

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/story/${id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={20} /> กลับ
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={28} className="text-primary" /> ตั้งค่าเนื้อเรื่อง
          </h1>
        </div>
        <button onClick={handleDelete} className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={16} /> ลบสตอรี่
        </button>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Basic Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>ข้อมูลทั่วไป</h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ชื่อเรื่อง *</label>
            <input 
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>คำโปรย / อธิบาย</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', minHeight: '120px', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>รูปภาพปก (URL)</label>
            <input 
              type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 600 }}>เปิดเป็นสาธารณะ (Public)</span>
          </label>
        </div>

        {/* Feature Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>ระบบที่ต้องการใช้งาน (Feature Toggles)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '-1rem 0 0 0' }}>เลือกเปิด/ปิดระบบที่คุณต้องการให้แสดงในสตอรี่นี้</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--radius)' }}>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.enableChapters !== false} onChange={e => setSettings({...settings, enableChapters: e.target.checked})} style={{ width: 18, height: 18 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><List size={16} className="text-primary" /> ระบบตอน (Chapters)</span>
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>สำหรับเขียนเนื้อเรื่องแบ่งเป็นตอนๆ (มีระบบล็อคตอนได้)</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.enableTimeline !== false} onChange={e => setSettings({...settings, enableTimeline: e.target.checked})} style={{ width: 18, height: 18 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} className="text-primary" /> ระบบไทม์ไลน์ (Timeline)</span>
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>จัดเรียงเหตุการณ์ตามลำดับเวลา</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.enableMaps !== false} onChange={e => setSettings({...settings, enableMaps: e.target.checked})} style={{ width: 18, height: 18 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Map size={16} className="text-primary" /> ระบบแผนที่ (Maps)</span>
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>อัปโหลดภาพแผนที่และปักหมุดเหตุการณ์หรือสถานที่</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.enableRelationships !== false} onChange={e => setSettings({...settings, enableRelationships: e.target.checked})} style={{ width: 18, height: 18 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} className="text-primary" /> ตัวละครที่เกี่ยวข้อง (Characters)</span>
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>ดึงตัวละครหรืออัลบั้มที่มีอยู่เข้ามาในสตอรี่นี้</span>
              </div>
            </label>

          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            onClick={handleSave} 
            disabled={!title.trim() || saving}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '99px', opacity: (!title.trim() || saving) ? 0.5 : 1 }}
          >
            <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
}
