'use client';
import { useState, useEffect } from 'react';
import { X, UploadCloud, Edit3, Trash2, Plus, Infinity as InfinityIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';
import CharacterRadarChart from './RadarChart';

interface Story {
  id: string;
  title: string;
  description: string;
  isLocked?: boolean;
}

interface Stat {
  label: string;
  value: number;
  breakLimit: boolean;
}

interface CharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  universeId?: string;
}

const DEFAULT_STATS: Stat[] = [
  { label: 'Strength', value: 50, breakLimit: false },
  { label: 'Mana', value: 50, breakLimit: false },
  { label: 'Intelligence', value: 50, breakLimit: false },
  { label: 'Speed', value: 50, breakLimit: false },
  { label: 'Magic', value: 50, breakLimit: false },
  { label: 'Potential', value: 50, breakLimit: false },
];

export default function CharacterFormModal({ isOpen, onClose, onSubmit, initialData, universeId }: CharacterFormModalProps) {
  const [loading, setLoading] = useState(false);

  // Basic Info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Radar Params
  const [useRadar, setUseRadar] = useState(false);
  const [radarColor, setRadarColor] = useState('#ec4899');
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);

  // Details
  const [personality, setPersonality] = useState('');
  const [bio, setBio] = useState('');
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setImageUrl(initialData.imageUrl || '');
        setBio(initialData.bio || '');

        const extra = initialData.statsJSON || {};
        setAge(extra.age || '');
        setGender(extra.gender || '');
        setHeight(extra.height || '');
        setWeight(extra.weight || '');
        setNationality(extra.nationality || '');
        setDob(extra.dob || '');
        setOccupation(extra.occupation || '');
        setEthnicity(extra.ethnicity || '');
        setPersonality(extra.personality || '');
        setStories(extra.stories || []);

        if (extra.radar) {
          setUseRadar(true);
          setRadarColor(extra.radar.color || '#ec4899');
          setStats(extra.radar.stats || DEFAULT_STATS);
        } else {
          setUseRadar(false);
          setStats(DEFAULT_STATS);
        }
      } else {
        // Reset form
        setName(''); setAge(''); setGender(''); setHeight(''); setWeight(''); setImageUrl('');
        setNationality(''); setDob(''); setOccupation(''); setEthnicity('');
        setUseRadar(false); setRadarColor('#ec4899'); setStats(DEFAULT_STATS);
        setPersonality(''); setBio(''); setStories([]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const statsJSON = {
      age, gender, height, weight, nationality, dob, occupation, ethnicity, personality, stories,
      ...(useRadar ? { radar: { color: radarColor, stats } } : {})
    };

    const data: any = { name, imageUrl, bio, statsJSON };
    if (!initialData && universeId) {
      data.universeId = universeId;
    }
    
    await onSubmit(data);
    setLoading(false);
  };

  const handleAddStory = () => {
    setStories([...stories, { id: Math.random().toString(36).substring(7), title: '', description: '', isLocked: false }]);
  };

  const updateStory = (id: string, field: keyof Story, value: any) => {
    setStories(stories.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStory = (id: string) => {
    setStories(stories.filter(s => s.id !== id));
  };

  const updateStat = (index: number, field: keyof Stat, value: any) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setStats(newStats);
  };

  // Convert stats array to Record<string, any> for the RadarChart component
  const radarChartData = stats.reduce((acc, curr) => {
    acc[curr.label || 'Unknown'] = { value: curr.value, breakLimit: curr.breakLimit };
    return acc;
  }, {} as any);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem', overflowY: 'auto' }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: '100%', padding: 0, background: '#0f1016', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={18} color="var(--primary)" /> {initialData ? 'แก้ไข OC' : 'เพิ่ม OC ใหม่'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Basic Info */}
          <div>
            <label className="label">ชื่อตัวละคร <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="ระบุชื่อตัวละคร..." required />
          </div>

          <div className="grid-2-col">
            <div>
              <label className="label">อายุ</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={age} onChange={(e) => setAge(e.target.value)} placeholder="เช่น 24 ปี" />
            </div>
            <div>
              <label className="label">เพศ</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={gender} onChange={(e) => setGender(e.target.value)} placeholder="เช่น ชาย / หญิง" />
            </div>
            <div>
              <label className="label">ส่วนสูง</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="เช่น 175 ซม." />
            </div>
            <div>
              <label className="label">น้ำหนัก</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="เช่น 65 กก." />
            </div>
            <div>
              <label className="label">วันเดือนปีเกิด</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="เช่น 1 มกราคม 2000" />
            </div>
            <div>
              <label className="label">อาชีพ</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="เช่น นักเรียน, นักดาบ" />
            </div>
            <div>
              <label className="label">สัญชาติ</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="เช่น ไทย, ญี่ปุ่น" />
            </div>
            <div>
              <label className="label">เชื้อชาติ</label>
              <input className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)' }} value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} placeholder="เช่น เอเชีย, เอลฟ์" />
            </div>
          </div>

          <div>
            <label className="label">อัปโหลดรูปภาพ</label>
            <div style={{ border: '2px dashed rgba(124,58,237,0.3)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', background: 'rgba(124,58,237,0.02)' }}>
              <ImageUpload onUploaded={setImageUrl} currentUrl={imageUrl} size={100} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>คลิกอัปโหลดรูปภาพจากเครื่อง</p>
            </div>
          </div>

          {/* Radar Params */}
          <div style={{ background: '#13141c', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: useRadar ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>พารามิเตอร์เรดาร์</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>พิมพ์แก้ไขชื่อมุมสถิติด้านล่างได้ทันที</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: 44, height: 24, background: useRadar ? 'var(--primary)' : 'rgba(255,255,255,0.1)', borderRadius: 99, transition: '0.3s' }}>
                  <div style={{ position: 'absolute', top: 2, left: useRadar ? 22 : 2, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                </div>
                <span style={{ fontSize: '0.8rem' }}>{useRadar ? 'เปิดใช้งาน' : 'ปิด'}</span>
                <input type="checkbox" checked={useRadar} onChange={(e) => setUseRadar(e.target.checked)} style={{ display: 'none' }} />
              </label>
            </div>

            {useRadar && (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>สีของกราฟเรดาร์:</span>
                  <input type="color" value={radarColor} onChange={(e) => setRadarColor(e.target.value)} style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {stats.map((stat, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          <Edit3 size={14} color="var(--text-muted)" />
                          <input
                            value={stat.label}
                            onChange={(e) => updateStat(i, 'label', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.9rem', width: '100%', outline: 'none' }}
                          />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={stat.value}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > 100) val = 100;
                            updateStat(i, 'value', val);
                          }}
                          style={{ width: 60, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.25rem', borderRadius: 4, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stat.value}
                        onChange={(e) => updateStat(i, 'value', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)', marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => updateStat(i, 'breakLimit', !stat.breakLimit)}
                          style={{
                            background: stat.breakLimit ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.05)',
                            border: stat.breakLimit ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                            color: stat.breakLimit ? '#ec4899' : 'var(--text-muted)',
                            padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer'
                          }}
                        >
                          <InfinityIcon size={12} /> {stat.breakLimit ? 'ทะลุกราฟแล้ว' : 'ทะลุกราฟ'}
                        </button>
                        <span style={{ fontSize: '0.7rem', color: stat.breakLimit ? '#ec4899' : 'var(--text-muted)' }}>
                          {stat.breakLimit ? 'โหมดอิสระ' : 'มาตรฐาน (0-100)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                  <div style={{ pointerEvents: 'none', width: '100%', maxWidth: 300, display: 'flex', justifyContent: 'center' }}>
                    <CharacterRadarChart stats={radarChartData} size={200} color={radarColor} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Personality & Backstory */}
          <div>
            <label className="label">ลักษณะนิสัย / บุคลิก</label>
            <textarea className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)', resize: 'vertical' }} rows={3} value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="ระบุลักษณะนิสัย..." />
          </div>
          <div>
            <label className="label">ประวัติย่อ / ข้อมูลเบื้องหลัง</label>
            <textarea className="input" style={{ background: '#13141c', borderColor: 'rgba(255,255,255,0.05)', resize: 'vertical' }} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="ระบุประวัติเบื้องหลัง..." />
          </div>

          {/* Story Logs */}
          <div style={{ border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '1.25rem', background: 'rgba(245,158,11,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                สตอรี่ตัวละคร / บันทึกเรื่องราว
              </h3>
              <button type="button" onClick={handleAddStory} style={{ background: '#f59e0b', color: 'black', border: 'none', padding: '0.4rem 0.75rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <Plus size={14} /> เพิ่ม
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stories.map((story) => (
                <div key={story.id} style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="input" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} value={story.title} onChange={(e) => updateStory(story.id, 'title', e.target.value)} placeholder="หัวข้อสตอรี่ / ตอนที่..." />
                    <button
                      type="button"
                      onClick={() => updateStory(story.id, 'isLocked', !story.isLocked)}
                      style={{ padding: '0.5rem 0.75rem', background: story.isLocked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: story.isLocked ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', color: story.isLocked ? '#ef4444' : 'var(--text-muted)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
                    >
                      {story.isLocked ? 'ล็อก (เฉพาะคุณที่เห็น)' : 'เปิดสาธารณะ'}
                    </button>
                    <button type="button" onClick={() => removeStory(story.id)} className="btn-danger" style={{ padding: '0.5rem' }}><Trash2 size={16} /></button>
                  </div>
                  <textarea className="input" style={{ padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical' }} rows={2} value={story.description} onChange={(e) => updateStory(story.id, 'description', e.target.value)} placeholder="รายละเอียดสตอรี่ หรือเหตุการณ์สำคัญ..." />
                </div>
              ))}
              {stories.length === 0 && <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ยังไม่มีสตอรี่ เพิ่มเลย!</p>}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <button type="submit" disabled={loading} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
