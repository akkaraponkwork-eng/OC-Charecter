'use client';
import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import CharacterCard from '@/components/CharacterCard';
import ChatBox from '@/components/ChatBox';
import CharacterFormModal from '@/components/CharacterFormModal';
import ImageUpload from '@/components/ImageUpload';
import StoryCard from '@/components/StoryCard';
import { Lock, Globe, Link, Users, MessageCircle, BarChart2, Copy, Pencil, Trash2, Settings, Check, X, LogOut, Book } from 'lucide-react';

const DEFAULT_STATS = { STR: 50, DEX: 50, INT: 50, WIS: 50, CHA: 50, CON: 50 };

export default function UniverseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { t } = useLocale();
  const { characters, setCharacters, addCharacter } = useStore();
  const { showToast } = useToast();
  const [universe, setUniverse] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddChar, setShowAddChar] = useState(false);
  const [showSelectChar, setShowSelectChar] = useState(false);
  const [myAllCharacters, setMyAllCharacters] = useState<any[]>([]);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteMsgOk, setInviteMsgOk] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [suggLoading, setSuggLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const uid = (session?.user as any)?.uid;
  const isAdmin = (session?.user as any)?.role === 'admin';

  // Character form state
  const [charLoading, setCharLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  // Edit Universe state
  const [showEditUni, setShowEditUni] = useState(false);
  const [editUniName, setEditUniName] = useState('');
  const [editUniDesc, setEditUniDesc] = useState('');
  const [editUniCover, setEditUniCover] = useState('');
  const [editUniStories, setEditUniStories] = useState<any[]>([]);

  // Edit Character state
  const [editCharId, setEditCharId] = useState<string | null>(null);

  const [inviteCopied, setInviteCopied] = useState(false);

  // Add Story state (for collabs)
  const [showAddStory, setShowAddStory] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [newStoryLocked, setNewStoryLocked] = useState(false);
  const [addStoryLoading, setAddStoryLoading] = useState(false);

  useEffect(() => {
    // Load universe info
    fetch(`/api/universes/${id}`)
      .then(r => {
        if (!r.ok) {
          if (r.status === 404 || r.status === 403) window.location.href = '/dashboard';
          return null;
        }
        return r.json();
      })
      .then(uni => {
        if (uni) {
          setUniverse(uni);
          setEditUniName(uni.name);
          setEditUniDesc(uni.description || '');
          setEditUniCover(uni.coverUrl || '');
          setEditUniStories(uni.stories || []);
        }
      });

    // Load characters
    fetch(`/api/characters?universeId=${id}`).then(r => r.json()).then(data => {
      setCharacters(Array.isArray(data) ? data : []);
      setLoading(false);
    });
    // Load collaborators
    fetch(`/api/universes/${id}/invite`).then(r => r.json()).then(data => {
      setCollaborators(Array.isArray(data) ? data : []);
    });
  }, [id]);

  const isOwner = universe?.userId === uid;
  const universeChars = characters.filter((c: any) => c.universeId === id);



  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/universe/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${id}`);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleInviteQueryChange = async (val: string) => {
    setInviteQuery(val);
    setSelectedUser(null);
    setInviteMsg('');
    if (val.trim().length < 1) { setUserSuggestions([]); return; }
    setSuggLoading(true);
    try {
      const res = await fetch('/api/users');
      const users = await res.json();
      const q = val.replace('@', '').toLowerCase();
      const filtered = users.filter((u: any) =>
        u.username?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q)
      ).slice(0, 6);
      setUserSuggestions(filtered);
    } catch { setUserSuggestions([]); }
    setSuggLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = selectedUser?.username || inviteQuery.trim();
    if (!target) return;
    setInviteLoading(true); setInviteMsg('');
    const res = await fetch(`/api/universes/${id}/invite`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: target.replace('@', '') }),
    });
    const data = await res.json();
    setInviteMsgOk(res.ok);
    setInviteMsg(res.ok ? `✓ เชิญ ${data.inviteeName || target} สำเร็จ!` : `${data.error}`);
    if (res.ok) { setInviteQuery(''); setSelectedUser(null); setUserSuggestions([]); }
    setInviteLoading(false);
  };

  const handleSaveCharacter = async (data: any) => {
    setCharLoading(true);
    if (selectedCharacter) {
      // Edit
      const res = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setCharacters(characters.map((c: any) => c.id === selectedCharacter.id ? { ...c, ...data } : c));
        setShowAddChar(false);
        setSelectedCharacter(null);
      }
    } else {
      // Create
      const res = await fetch('/api/characters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newChar = await res.json();
      if (res.ok) {
        addCharacter(newChar);
        setShowAddChar(false);
      }
    }
    setCharLoading(false);
  };

  const loadMyCharacters = async () => {
    const res = await fetch('/api/characters');
    const data = await res.json();
    if (Array.isArray(data)) setMyAllCharacters(data);
    setShowSelectChar(true);
  };

  const handleAddExistingCharacter = async (charId: string) => {
    const res = await fetch(`/api/characters/${charId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addUniverseId: id }),
    });
    if (res.ok) {
      const char = myAllCharacters.find(c => c.id === charId);
      if (char) {
        setCharacters([...characters, { ...char, universeIds: [...(char.universeIds || []), id] }]);
      }
      setShowSelectChar(false);
      showToast('Character added to universe', 'success');
    }
  };

  const handleRemoveCharacterFromUniverse = async (charId: string) => {
    if (!confirm('Are you sure you want to remove this character from the universe? They will remain in your Characters pool.')) return;
    const res = await fetch(`/api/characters/${charId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeUniverseId: id }),
    });
    if (res.ok) {
      setCharacters(characters.filter(c => c.id !== charId));
      showToast('Character removed from universe', 'success');
    }
  };

  const handleAddUniStory = () => {
    setEditUniStories([...editUniStories, { id: Date.now().toString(), title: '', description: '', isLocked: false }]);
  };
  const updateUniStory = (id: string, field: string, value: any) => {
    setEditUniStories(editUniStories.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const removeUniStory = (id: string) => {
    setEditUniStories(editUniStories.filter(s => s.id !== id));
  };

  const handleEditUniverse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/universes/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editUniName, description: editUniDesc, coverUrl: editUniCover, stories: editUniStories }),
    });
    if (res.ok) {
      setUniverse({ ...universe, name: editUniName, description: editUniDesc, coverUrl: editUniCover, stories: editUniStories });
      setShowEditUni(false);
    }
  };

  const handleDeleteUniverse = async () => {
    if (!confirm('Are you sure you want to delete this universe? All characters will be lost.')) return;
    await fetch(`/api/universes/${id}`, { method: 'DELETE' });
    window.location.href = '/dashboard';
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim()) return;
    setAddStoryLoading(true);
    const res = await fetch(`/api/universes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', story: { title: newStoryTitle, description: newStoryDesc, isLocked: newStoryLocked } }),
    });
    const data = await res.json();
    if (res.ok) {
      setUniverse((prev: any) => ({ ...prev, stories: data.stories }));
      setNewStoryTitle(''); setNewStoryDesc(''); setNewStoryLocked(false); setShowAddStory(false);
      showToast('เพิ่มสตอรี่สำเร็จ!', 'success');
    } else {
      showToast(data.error || 'Failed to add story', 'error');
    }
    setAddStoryLoading(false);
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('ลบสตอรี่นี้?')) return;
    const res = await fetch(`/api/universes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', storyId }),
    });
    const data = await res.json();
    if (res.ok) {
      setUniverse((prev: any) => ({ ...prev, stories: data.stories }));
      showToast('ลบสตอรี่แล้ว', 'success');
    } else {
      showToast(data.error || 'ไม่สามารถลบสตอรี่ได้', 'error');
    }
  };

  const handleRemoveCollaborator = async (targetUserId: string) => {
    if (!confirm(t('common.confirmDelete') || 'Are you sure?')) return;
    const res = await fetch(`/api/universes/${id}/invite`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId }),
    });
    if (res.ok) {
      if (targetUserId === uid) {
        window.location.href = '/dashboard';
      } else {
        setCollaborators(collaborators.filter(c => c.userId !== targetUserId));
        showToast('Collaborator removed', 'success');
      }
    } else {
      showToast('Error removing collaborator', 'error');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (!universe) return <div className="page-container"><p>Universe not found</p></div>;

  return (
    <div className="page-container">
      {/* Universe header */}
      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        height: 200, marginBottom: '1.5rem',
        background: universe.coverUrl ? `url(${universe.coverUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9), rgba(10,10,15,0.3))' }} />
        <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.5rem', right: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{universe.name}</h1>
          {universe.description && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{universe.description}</p>}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {(isOwner || universe?.isCollaborator || isAdmin) && (
          <button className="btn-primary" onClick={loadMyCharacters} style={{ fontSize: '0.875rem' }}>
            {t('universe.addCharacter')}
          </button>
        )}
        {(isOwner || universe?.isCollaborator || isAdmin) && (
          <button className="btn-secondary" onClick={() => setShowAddStory(!showAddStory)} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Book size={14} /> เพิ่มสตอรี่
          </button>
        )}
        {isOwner && (<>
          <button className="btn-secondary" onClick={handleCopyLink} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Link size={14} /> {copied ? t('universe.copied') : t('universe.copyLink')}
          </button>
          <button className="btn-secondary" onClick={() => setShowInvite(!showInvite)} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={14} /> {t('universe.invite')} {collaborators.length > 0 && `(${collaborators.length})`}
          </button>
          <button className="btn-secondary" onClick={() => setShowEditUni(true)} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Settings size={14} /> Edit Universe
          </button>
        </>)}
        {universe?.isCollaborator && (
          <button className="btn-danger" onClick={() => handleRemoveCollaborator(uid)} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={14} /> Leave Universe
          </button>
        )}
        {(isOwner || universe?.isCollaborator || isAdmin) && (
          <button className="btn-secondary" onClick={() => setShowChat(!showChat)} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageCircle size={14} /> {t('universe.chat')}
          </button>
        )}
      </div>

      {/* Invite panel */}
      {showInvite && isOwner && (
        <div className="glass-sm" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={16} /> {t('universe.collaborators')}</h3>
          {collaborators.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {collaborators.map((c) => (
                <div key={c.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '99px', padding: '0.25rem 0.75rem 0.25rem 0.25rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.avatarUrl ? `url(${c.avatarUrl}) center/cover` : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 700 }}>
                    {!c.avatarUrl && c.displayName[0]}
                  </div>
                  <span style={{ fontSize: '0.8rem' }}>{c.displayName}</span>
                  <button onClick={() => handleRemoveCollaborator(c.userId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }} title="Remove">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="input"
                    value={inviteQuery}
                    onChange={(e) => handleInviteQueryChange(e.target.value)}
                    onFocus={() => inviteQuery && handleInviteQueryChange(inviteQuery)}
                    placeholder="@username หรือชื่อผู้ใช้"
                    style={{ width: '100%', paddingLeft: selectedUser ? '2.5rem' : undefined }}
                    autoComplete="off"
                  />
                  {selectedUser && (
                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: selectedUser.avatarUrl ? `url(${selectedUser.avatarUrl}) center/cover` : 'var(--primary)', backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>
                      {!selectedUser.avatarUrl && selectedUser.displayName?.[0]}
                    </div>
                  )}
                </div>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={inviteLoading || (!selectedUser && !inviteQuery.trim())}
                  style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {inviteLoading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Users size={14} />}
                  {inviteLoading ? '...' : t('invitations.inviteButton')}
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {userSuggestions.length > 0 && !selectedUser && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 80,
                  background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, zIndex: 50, marginTop: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden',
                }}>
                  {suggLoading ? (
                    <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>กำลังค้นหา...</div>
                  ) : (
                    userSuggestions.map((u) => (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => { setSelectedUser(u); setInviteQuery(u.username); setUserSuggestions([]); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.6rem 1rem', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                          borderBottom: '1px solid var(--glass-border)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))', backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 700 }}>
                          {!u.avatarUrl && u.displayName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.displayName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </form>
          {inviteMsg && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: inviteMsgOk ? '#34d399' : '#f87171' }}>{inviteMsg}</p>}

          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Or share this invite link to allow anyone to collaborate:</p>
            <div style={{ display: 'flex', gap: '0.5rem', height: 42 }}>
              <input className="input" readOnly value={`${window.location.origin}/invite/${id}`} style={{ flex: 1, height: '100%', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-main)' }} />
              <button className="btn-secondary" onClick={handleCopyInviteLink} style={{ height: '100%', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {inviteCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universe Stories Section */}
      {((universe.stories && universe.stories.length > 0) || showAddStory) && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Book size={20} /> {t('universe.stories')}
          </h2>

          {/* Add Story Form (collaborator / owner / admin) */}
          {showAddStory && (
            <form onSubmit={handleAddStory} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Book size={16} /> เพิ่มสตอรี่ใหม่
              </div>
              <input className="input" placeholder="หัวข้อสตอรี่ *" value={newStoryTitle} onChange={e => setNewStoryTitle(e.target.value)} required />
              <textarea className="input" placeholder="รายละเอียดเนื้อเรื่อง..." rows={3} value={newStoryDesc} onChange={e => setNewStoryDesc(e.target.value)} style={{ resize: 'vertical' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={newStoryLocked} onChange={e => setNewStoryLocked(e.target.checked)} />
                <Lock size={13} /> ล็อก (เฉพาะผู้ร่วมงานที่เห็น)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddStory(false); setNewStoryTitle(''); setNewStoryDesc(''); }}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={addStoryLoading || !newStoryTitle.trim()}>
                  {addStoryLoading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
                  {addStoryLoading ? 'กำลังบันทึก...' : 'บันทึกสตอรี่'}
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(universe.stories || []).map((story: any) => {
              const canDeleteStory = isOwner || isAdmin || story.addedBy === uid;
              return (
                <div key={story.id} style={{ position: 'relative' }}>
                  <StoryCard
                    story={story}
                    targetId={id}
                    type="universe"
                    isOwner={isOwner || universe.isCollaborator || isAdmin}
                  />
                  {canDeleteStory && (
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(239,68,68,0.85)', border: 'none', color: 'white', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', zIndex: 5 }}
                      title="ลบสตอรี่"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Characters */}
      <div className="section-header">
        <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> {universeChars.length} {universeChars.length === 1 ? 'Character' : 'Characters'}
        </h2>
      </div>

      {universeChars.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', opacity: 0.5 }}><Users size={48} /></div>
          <p>{t('dashboard.noUniverses').replace('จักรวาล', 'ตัวละคร')}</p>
        </div>
      ) : (
        <div className="grid-cards">
          {universeChars.map((c: any) => {
            const isCharOwner = c.userId === uid;
            const canEdit = isAdmin || isCharOwner;
            const canRemove = isOwner || isAdmin || isCharOwner;
            return (
              <div key={c.id} style={{ position: 'relative' }}>
                <CharacterCard character={c} hideDelete />
                {(canEdit || canRemove) && (
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                    {canEdit && (
                      <button
                        onClick={() => { setSelectedCharacter(c); setShowAddChar(true); }}
                        style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                        title="Edit Character"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveCharacterFromUniverse(c.id)}
                        style={{ background: 'rgba(239,68,68,0.8)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                        title={isOwner || isAdmin ? 'Remove from Universe' : 'Remove My Character'}
                      >
                        <LogOut size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Select Character Modal */}
      {showSelectChar && (
        <div className="modal-overlay" onClick={() => setShowSelectChar(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Add Character to Universe
              </h2>
              <button onClick={() => setShowSelectChar(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <button className="btn-secondary" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed' }} onClick={() => { setShowSelectChar(false); setSelectedCharacter(null); setShowAddChar(true); }}>
                + Create Brand New Character
              </button>
            </div>

            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Or select an existing character:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {myAllCharacters.filter(c => !(c.universeIds || []).includes(id) && c.userId === uid).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No available characters to add.</p>
              ) : (
                myAllCharacters.filter(c => !(c.universeIds || []).includes(id) && c.userId === uid).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--glass)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.imageUrl ? `url(${c.imageUrl}) center/cover` : 'var(--glass-border)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.bio || 'No bio'}</div>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => handleAddExistingCharacter(c.id)}>
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Character Modal */}
      <CharacterFormModal
        isOpen={showAddChar}
        onClose={() => { setShowAddChar(false); setSelectedCharacter(null); }}
        onSubmit={handleSaveCharacter}
        initialData={selectedCharacter}
        universeId={id}
      />

      {/* Edit Universe Modal */}
      {showEditUni && (
        <div className="modal-overlay" onClick={() => setShowEditUni(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} /> Edit Universe</h2>
            <form onSubmit={handleEditUniverse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ImageUpload onUploaded={(url) => setEditUniCover(url)} currentUrl={editUniCover} size={150} />
              </div>
              <div>
                <label className="label">Universe Name *</label>
                <input className="input" value={editUniName} onChange={(e) => setEditUniName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={editUniDesc} onChange={(e) => setEditUniDesc(e.target.value)} />
              </div>

              {/* Story Logs */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="label" style={{ marginBottom: 0 }}>{t('universe.stories')}</label>
                  <button type="button" onClick={handleAddUniStory} style={{ background: '#f59e0b', color: 'black', border: 'none', padding: '0.4rem 0.75rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    + เพิ่มสตอรี่
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 300, overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {editUniStories.map((story) => (
                    <div key={story.id} style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input className="input" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} value={story.title} onChange={(e) => updateUniStory(story.id, 'title', e.target.value)} placeholder="หัวข้อสตอรี่ / โลเคชั่น" />
                        <button type="button"
                          onClick={() => updateUniStory(story.id, 'isLocked', !story.isLocked)}
                          style={{ padding: '0.5rem 0.75rem', background: story.isLocked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: story.isLocked ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', color: story.isLocked ? '#ef4444' : 'var(--text-muted)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
                        >
                          {story.isLocked ? 'ล็อก (เฉพาะคุณที่เห็น)' : 'เปิดสาธารณะ'}
                        </button>
                        <button type="button" onClick={() => removeUniStory(story.id)} className="btn-danger" style={{ padding: '0.5rem' }}><Trash2 size={16} /></button>
                      </div>
                      <textarea className="input" style={{ padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical' }} rows={2} value={story.description} onChange={(e) => updateUniStory(story.id, 'description', e.target.value)} placeholder="รายละเอียดเนื้อเรื่อง หรือสถานที่สำคัญ..." />
                    </div>
                  ))}
                  {editUniStories.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>ยังไม่มีสตอรี่จักรวาล เพิ่มเรื่องราวของคุณเลย</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button type="button" className="btn-danger" onClick={handleDeleteUniverse} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Trash2 size={16} /> Delete
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowEditUni(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="btn-primary">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universe Chat Panel */}
      {showChat && (
        <div style={{ position: 'fixed', bottom: 0, right: 32, width: 340, height: 480, zIndex: 100, boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', overflow: 'hidden' }}>
          <ChatBox
            chatId={`universe_${id}`}
            title={`${universe.name}`}
            onClose={() => setShowChat(false)}
            asPanel
          />
        </div>
      )}
    </div>
  );
}
