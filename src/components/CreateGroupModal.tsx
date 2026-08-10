'use client';
import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { useToast } from '@/store/useToast';

interface Props {
  onClose: () => void;
  onCreated: (group: { id: string; name: string }) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to create group', 'error');
      } else {
        showToast(`กลุ่ม "${data.name}" ถูกสร้างแล้ว!`, 'success');
        onCreated(data);
        onClose();
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-elevated)', borderRadius: 16,
          padding: '2rem', width: '100%', maxWidth: 420,
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>สร้างกลุ่มแชท</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Create a new group chat</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ชื่อกลุ่ม
            </label>
            <input
              className="input"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
              placeholder="เช่น: นักเขียน OC ร่วมกัน"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={50}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.25rem', textAlign: 'right' }}>
              {name.length}/50
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.75rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !name.trim()}
              style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
              {loading ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
