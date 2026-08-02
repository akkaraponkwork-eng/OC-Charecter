'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import { MessageCircle, Trash2, Settings, Users, UserPlus, X } from 'lucide-react';
import { useToast } from '@/store/useToast';

interface Message {
  id: string; senderId: string; senderName: string;
  senderAvatar: string; content: string; createdAt: string;
}

interface Props {
  chatId: string;
  title: string;
  onClose?: () => void;
  asPanel?: boolean; // slide-in panel vs full page
}

export default function ChatBox({ chatId, title, onClose, asPanel }: Props) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const uid = (session?.user as any)?.uid;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [groupData, setGroupData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const { showToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?chatId=${chatId}`);
    if (res.ok) { 
      const data = await res.json(); 
      setMessages(data); 
      // Mark as read immediately when messages are loaded
      localStorage.setItem('lastRead_' + chatId, new Date().toISOString());
      localStorage.setItem('lastSeenMsg_' + chatId, new Date().toISOString());
    }
  };

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 20000);

    if (chatId.startsWith('group_')) {
      fetch(`/api/groups/${chatId}`).then(r => r.json()).then(data => {
        if (!data.error) setGroupData(data);
      });
    }

    return () => clearInterval(intervalRef.current);
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviteLoading(true);
    const res = await fetch(`/api/groups/${chatId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inviteUsername.trim() }),
    });
    if (res.ok) {
      showToast('User invited successfully!', 'success');
      setInviteUsername('');
      // refresh group data
      fetch(`/api/groups/${chatId}`).then(r => r.json()).then(data => {
        if (!data.error) setGroupData(data);
      });
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to invite', 'error');
    }
    setInviteLoading(false);
  };

  const handleKick = async (targetUid: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    const res = await fetch(`/api/groups/${chatId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUid }),
    });
    if (res.ok) {
      showToast('User removed', 'success');
      setGroupData({ ...groupData, members: groupData.members.filter((m: any) => m.uid !== targetUid) });
      if (targetUid === uid) {
        if (onClose) onClose();
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, content: input.trim() }),
    });
    setInput('');
    setSending(false);
    fetchMessages();
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm(t('common.confirmDelete') || 'Delete this message?')) return;
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const containerStyle = asPanel ? {
    position: 'fixed' as const, right: 0, top: 60, bottom: 0,
    width: 360, background: 'var(--bg-elevated)', borderLeft: '1px solid var(--glass-border)',
    display: 'flex', flexDirection: 'column' as const, zIndex: 30,
  } : {
    display: 'flex', flexDirection: 'column' as const, height: '100%',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={16} /> {title}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {chatId.startsWith('group_') && (
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Settings size={18} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <p suppressHydrationWarning style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
            {t('chat.noMessages')}
          </p>
        )}
        {messages.map((msg) => {
          const isSelf = msg.senderId === uid;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isSelf ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-end' }}>
              {!isSelf && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.senderAvatar ? `url(${msg.senderAvatar}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'white',
                }}>
                  {!msg.senderAvatar && msg.senderName[0].toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                {!isSelf && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{msg.senderName}</div>}
                <div className={isSelf ? 'bubble-self' : 'bubble-other'}>{msg.content}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '0.2rem', display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                  {isSelf && (
                    <button 
                      onClick={() => deleteMessage(msg.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      title="Unsend message"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
        <input
          className="input"
          style={{ flex: 1, padding: '0.5rem 0.875rem', fontSize: '1rem' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.typeMessage')}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
        />
        <button suppressHydrationWarning className="btn-primary" type="submit" disabled={sending || !input.trim()}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          {t('chat.send')}
        </button>
      </form>

      {/* Group Settings Modal */}
      {showSettings && groupData && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Group Settings
              </h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {groupData.ownerId === uid && (
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input 
                  className="input" 
                  style={{ flex: 1 }} 
                  value={inviteUsername} 
                  onChange={e => setInviteUsername(e.target.value)} 
                  placeholder="Invite by username (e.g. admin)" 
                  required 
                />
                <button type="submit" className="btn-primary" disabled={inviteLoading}>
                  <UserPlus size={16} /> Invite
                </button>
              </form>
            )}

            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Members ({groupData.members?.length || 0})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 250, overflowY: 'auto' }}>
                {groupData.members?.map((m: any) => (
                  <div key={m.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--glass)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.avatarUrl ? `url(${m.avatarUrl}) center/cover` : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 700 }}>
                        {!m.avatarUrl && (m.displayName?.[0] || m.username?.[0] || '?')}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.displayName || m.username}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{m.username} {m.uid === groupData.ownerId && '(Owner)'}</div>
                      </div>
                    </div>
                    {groupData.ownerId === uid && m.uid !== uid && (
                      <button onClick={() => handleKick(m.uid)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                    {m.uid === uid && groupData.ownerId !== uid && (
                      <button onClick={() => handleKick(uid)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem', fontSize: '0.8rem' }}>
                        Leave
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
