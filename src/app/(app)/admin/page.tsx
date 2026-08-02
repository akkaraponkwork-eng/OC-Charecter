'use client';
import { useEffect, useState } from 'react';
import { useLocale } from '@/store/useLocale';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Trash2, Key, Users, BookOpen, ChevronDown, ChevronUp, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/store/useToast';

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  
  // Protect route
  useEffect(() => {
    if (session && (session.user as any).role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);
  const [users, setUsers] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [universes, setUniverses] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users'|'characters'|'universes'>('users');
  
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);
  
  const [showReset, setShowReset] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetting, setResetting] = useState(false);
  
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = () => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/characters').then(r => r.json()),
      fetch('/api/admin/system-data').then(r => r.json())
    ]).then(([uData, cData, sysData]) => {
      setUsers(Array.isArray(uData) ? uData : []);
      setCharacters(Array.isArray(cData) ? cData : []);
      if (sysData && !sysData.error) {
        setUniverses(sysData.universes || []);
        setCollaborations(sysData.collaborations || []);
        setMessages(sysData.messages || []);
      }
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, email: newEmail, password: newPassword, role: newRole }),
    });
    if (res.ok) { showToast('User created!', 'success'); setShowCreate(false); setNewUsername(''); setNewEmail(''); setNewPassword(''); load(); }
    else { const d = await res.json(); showToast(`Error: ${d.error}`, 'error'); }
    setCreating(false);
  };

  const handleChangeRole = async (uid: string, role: string) => {
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, role }) });
    setUsers(users.map(u => u.uid === uid ? { ...u, role } : u));
    showToast('Role updated!', 'success');
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Delete this user?')) return;
    await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid }) });
    setUsers(users.filter(u => u.uid !== uid));
    showToast('User deleted!', 'info');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReset || !resetPasswordValue) return;
    setResetting(true);
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: showReset, resetPassword: resetPasswordValue }) });
    showToast('Password reset successful!', 'success'); 
    setResetting(false); setShowReset(null); setResetPasswordValue('');
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Delete this character?')) return;
    await fetch(`/api/admin/characters?id=${id}`, { method: 'DELETE' });
    setCharacters(characters.filter(c => c.id !== id));
    showToast('Character deleted!', 'info');
  };

  const handleDeleteSystemData = async (type: string, id: string) => {
    if (!confirm(`Delete this ${type}?`)) return;
    const res = await fetch(`/api/admin/system-data?type=${type}&id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (type === 'universe') setUniverses(universes.filter(u => u.id !== id));
      else if (type === 'collaboration') setCollaborations(collaborations.filter(c => c.id !== id));
      else if (type === 'message') setMessages(messages.filter(m => m.id !== id));
      showToast(`${type} deleted!`, 'info');
    } else {
      showToast(`Failed to delete ${type}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={24} /> {t('admin.title')}
        </h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: '0.875rem' }}>
          + {t('admin.createUser')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <Users size={18} /> Users
        </button>
        <button 
          onClick={() => setActiveTab('characters')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'characters' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'characters' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <BookOpen size={18} /> Characters
        </button>
        <button 
          onClick={() => setActiveTab('universes')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'universes' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'universes' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <BookOpen size={18} /> Universes
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-sm" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{users.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Users</div>
        </div>
        <div className="glass-sm" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{characters.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Characters</div>
        </div>
        <div className="glass-sm" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{universes.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Universes</div>
        </div>
      </div>

      {/* Tables */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : activeTab === 'users' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {users.map(user => {
            const isExpanded = expandedUser === user.uid;
            return (
              <div 
                key={user.uid} 
                className="glass" 
                style={{ 
                  borderRadius: 'var(--radius-lg)', 
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Card Header (Always visible) */}
                <div 
                  onClick={() => setExpandedUser(isExpanded ? null : user.uid)}
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(124,58,237,0.05)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white', fontWeight: 700 }}>
                      {!user.avatarUrl && (user.displayName || user.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.displayName || user.username}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{user.username}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 99, 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      background: user.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.1)',
                      color: user.role === 'admin' ? '#a78bfa' : 'var(--text-muted)'
                    }}>
                      {user.role}
                    </span>
                    {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Card Body (Expanded) */}
                {isExpanded && (
                  <div style={{ 
                    padding: '1.25rem', 
                    borderTop: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={14} /> Email Address
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>{user.email || 'No email provided'}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={14} /> Joined Date
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <BookOpen size={14} /> Bio
                        </div>
                        <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{user.bio || '—'}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield size={14} /> Is Public
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>{user.isPublic === 'true' ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--glass-border)' }} />

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Change Role:</span>
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.uid, e.target.value)}
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text-main)', padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="banned">Banned</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} 
                          onClick={() => setShowReset(user.uid)}
                        >
                          <Key size={14} /> Reset Password
                        </button>
                        <button 
                          className="btn-danger" 
                          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} 
                          onClick={() => handleDelete(user.uid)}
                        >
                          <Trash2 size={14} /> Delete Account
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : activeTab === 'characters' ? (
        <div className="glass" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Image', 'Character Name', 'Creator ID', 'Universe ID', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {characters.map(char => (
                <tr key={char.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: char.imageUrl ? `url(${char.imageUrl}) center/cover` : 'var(--glass-border)' }} />
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>
                    <a href={`/characters/${char.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} target="_blank">
                      {char.name}
                    </a>
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{char.userId}</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{char.universeId}</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{char.createdAt ? new Date(char.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <button 
                      className="btn-danger" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }} 
                      onClick={() => handleDeleteCharacter(char.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'universes' ? (
        <div className="glass" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Image', 'Universe Name', 'Creator ID', 'Public', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {universes.map(uni => (
                <tr key={uni.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: uni.imageUrl ? `url(${uni.imageUrl}) center/cover` : 'var(--glass-border)' }} />
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>
                    <a href={`/universes/${uni.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} target="_blank">
                      {uni.name}
                    </a>
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{uni.userId}</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{uni.isPublic === 'true' ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{uni.createdAt ? new Date(uni.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <button 
                      className="btn-danger" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }} 
                      onClick={() => handleDeleteSystemData('universe', uni.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Create user modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>+ {t('admin.createUser')}</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label className="label">Username *</label><input className="input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
              <div><label className="label">Password *</label><input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
              <div><label className="label">Role</label>
                <select className="input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? '...' : t('admin.createUser')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} /> Reset Password
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Enter a new password for this user. They will need to use this to log in.
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowReset(null)}>{t('common.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={resetting}>{resetting ? '...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
