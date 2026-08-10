'use client';
import { useState, useEffect } from 'react';
import { Users, X, Search, Shield } from 'lucide-react';
import { useToast } from '@/store/useToast';
import { useSession } from 'next-auth/react';

interface Props {
  onClose: () => void;
  onCreated: (group: { id: string; name: string }) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const { data: session } = useSession();
  const uid = (session?.user as any)?.uid;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
          if (uid) setSelectedIds([uid]);
        }
      })
      .catch(console.error);
  }, [uid]);

  const toggleUser = (userId: string) => {
    if (userId === uid) return; // Cannot remove self during creation
    setSelectedIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), memberIds: selectedIds }),
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
          padding: '2rem', width: '100%', maxWidth: 500,
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.2s ease',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh'
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
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
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

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              เลือกสมาชิกที่จะเพิ่มเข้ากลุ่ม ({selectedIds.length})
            </label>
            
            <div style={{ position: 'relative', marginBottom: '0.5rem', flexShrink: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
              <input 
                className="input"
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', fontSize: '0.85rem' }}
                placeholder="ค้นหาผู้ใช้..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--glass)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
              {users.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบผู้ใช้</div>
              ) : (
                filteredUsers.map(user => {
                  const isOwner = user.uid === uid;
                  const isSelected = selectedIds.includes(user.uid);
                  
                  return (
                    <div 
                      key={user.uid}
                      onClick={() => toggleUser(user.uid)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem', borderRadius: 8, cursor: isOwner ? 'default' : 'pointer',
                        background: isSelected ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                        border: isSelected ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent',
                        marginBottom: '0.25rem', transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white'
                        }}>
                          {!user.avatarUrl && (user.displayName || user.username)?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {user.displayName || user.username}
                            {isOwner && <Shield size={12} color="var(--accent)" title="You" />}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        width: 20, height: 20, borderRadius: 6, 
                        border: isSelected ? 'none' : '2px solid var(--glass-border)',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexShrink: 0 }}>
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
