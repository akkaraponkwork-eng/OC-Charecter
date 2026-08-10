'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function CreateStoryPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          coverImage,
          isPublic,
          settings: {
            enableMaps: true,
            enableTimeline: true,
            enableChapters: true,
            enableRelationships: true,
          }
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/story/${data.id}`);
      } else {
        alert('Failed to create story');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating story');
    }
    setSaving(false);
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/users" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} /> กลับ
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>สร้างสตอรี่ใหม่</h1>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ชื่อเรื่อง *</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ตั้งชื่อเรื่อง หรือ โปรเจคโลกของคุณ"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>คำโปรย / อธิบาย</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="อธิบายสั้นๆ เกี่ยวกับเนื้อเรื่อง..."
              style={{ width: '100%', minHeight: '120px', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>รูปภาพปก (URL)</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="https://..."
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>
            {coverImage && (
              <div style={{ marginTop: '1rem', width: '100%', height: '200px', borderRadius: 'var(--radius)', backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--glass-border)' }} />
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isPublic} 
              onChange={e => setIsPublic(e.target.checked)} 
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 600 }}>เปิดเป็นสาธารณะ (Public)</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>- คนนอกสามารถเข้ามาอ่านเนื้อเรื่องได้</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              onClick={handleSave} 
              disabled={!title.trim() || saving}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '99px', opacity: (!title.trim() || saving) ? 0.5 : 1 }}
            >
              <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'สร้างสตอรี่'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
