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
import { Lock, Globe, Link, Users, MessageCircle, BarChart2, Copy, Pencil, Trash2, Settings, Check, X, LogOut } from 'lucide-react';

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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const uid = (session?.user as any)?.uid;

  // Character form state
  const [charLoading, setCharLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  // Edit Universe state
  const [showEditUni, setShowEditUni] = useState(false);
  const [editUniName, setEditUniName] = useState('');
  const [editUniDesc, setEditUniDesc] = useState('');
  const [editUniCover, setEditUniCover] = useState('');

  // Edit Character state
  const [editCharId, setEditCharId] = useState<string | null>(null);

  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    // Load universe info
    fetch('/api/universes')
      .then(r => r.json())
      .then(data => {
        const uni = Array.isArray(data) ? data.find((u: any) => u.id === id) : null;
        if (uni) {
          setUniverse(uni);
          setEditUniName(uni.name);
          setEditUniDesc(uni.description || '');
          setEditUniCover(uni.coverUrl || '');
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

  const handleTogglePublic = async () => {
    await fetch(`/api/universes/${universe.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !universe.isPublic }),
    });
    setUniverse({ ...universe, isPublic: !universe.isPublic });
  };

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true); setInviteMsg('');
    const res = await fetch(`/api/universes/${id}/invite`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    setInviteMsg(res.ok ? 'Invited!' : `${data.error}`);
    if (res.ok) setInviteEmail('');
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

  const handleEditUniverse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/universes/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editUniName, description: editUniDesc, coverUrl: editUniCover }),
    });
    if (res.ok) {
      setUniverse({ ...universe, name: editUniName, description: editUniDesc, coverUrl: editUniCover });
      setShowEditUni(false);
    }
  };

  const handleDeleteUniverse = async () => {
    if (!confirm('Are you sure you want to delete this universe? All characters will be lost.')) return;
    await fetch(`/api/universes/${id}`, { method: 'DELETE' });
    window.location.href = '/dashboard';
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
        <button className="btn-primary" onClick={() => { setSelectedCharacter(null); setShowAddChar(true); }} style={{ fontSize: '0.875rem' }}>
          {t('universe.addCharacter')}
        </button>
        {isOwner && (<>
          <button className="btn-secondary" onClick={handleTogglePublic} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {universe.isPublic ? <Lock size={14} /> : <Globe size={14} />} {universe.isPublic ? t('universe.makePrimitive') : t('universe.sharePublic')}
          </button>
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
        <button className="btn-secondary" onClick={() => setShowChat(!showChat)} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MessageCircle size={14} /> {t('universe.chat')}
        </button>
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
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem' }}>
            <input className="input" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t('invitations.inviteByEmail')} style={{ flex: 1 }} required />
            <button className="btn-primary" type="submit" disabled={inviteLoading} style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {inviteLoading ? '...' : t('invitations.inviteButton')}
            </button>
          </form>
          {inviteMsg && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: inviteMsg.startsWith('Invited') ? '#34d399' : '#f87171' }}>{inviteMsg}</p>}

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
          {universeChars.map((c: any) => (
            <div key={c.id} style={{ position: 'relative' }}>
              <CharacterCard character={c} />
              {isOwner && (
                <button
                  onClick={() => { setSelectedCharacter(c); setShowAddChar(true); }}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          ))}
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
