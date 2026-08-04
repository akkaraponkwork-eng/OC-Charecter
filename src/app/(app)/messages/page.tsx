'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import { useSearchParams } from 'next/navigation';
import ChatBox from '@/components/ChatBox';
import { MessageCircle, Globe, User, Search, Users, Plus, X } from 'lucide-react';

function MessagesContent() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');
  const uid = (session?.user as any)?.uid;

  useEffect(() => {
    const fetchChats = () => {
      fetch('/api/chats').then(r => r.json()).then(chatsData => {
        if (!Array.isArray(chatsData)) return;
        
        // Add unread flag based on localStorage
        const enriched = chatsData.map(chat => {
          let isUnread = false;
          if (chat.latestMessage) {
            const lastRead = localStorage.getItem('lastRead_' + chat.id);
            if (!lastRead || new Date(chat.latestMessage.createdAt) > new Date(lastRead)) {
              isUnread = true;
            }
          }
          return { ...chat, isUnread };
        });
        
        setChats(enriched);
      });
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000); // refresh list
    return () => clearInterval(interval);
  }, [uid]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName }),
    });
    if (res.ok) {
      const data = await res.json();
      setChats(prev => [{ id: data.id, title: data.name, type: 'group', isOwner: true, memberCount: 1, isUnread: false }, ...prev]);
      setShowCreateGroup(false);
      setNewGroupName('');
      openChat(data.id, data.name);
    }
    setCreatingGroup(false);
  };

  const openChat = (id: string, title: string) => {
    setActiveChatId(id); setActiveChatTitle(title);
  };

  useEffect(() => {
    if (userIdFromUrl && uid) {
      // Sort UIDs alphabetically to form correct dm_id
      const sortedIds = [uid, userIdFromUrl].sort();
      const expectedChatId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
      setActiveChatId(expectedChatId);
      setActiveChatTitle('Chat'); // Will be updated if user sends a message or when list loads
    }
  }, [userIdFromUrl, uid]);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex' }}>
      {/* Sidebar */}
      <div className={`msg-sidebar ${activeChatId ? 'hidden-mobile' : ''}`}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={18} /> {t('chat.title')}
          </div>
          <button 
            onClick={() => setShowCreateGroup(true)}
            style={{ background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Create Group"
          >
            <Plus size={16} />
          </button>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('chat.search') || 'Search conversations...'} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '20px', border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.length === 0 ? (
            <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
              {searchQuery ? 'No conversations found.' : 'No conversations yet.'}
            </p>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  // Mark as read immediately when opening
                  if (chat.latestMessage) {
                    localStorage.setItem('lastRead_' + chat.id, new Date().toISOString());
                    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isUnread: false } : c));
                  }
                  openChat(chat.id, chat.title);
                }}
                style={{
                  display: 'flex', gap: '0.75rem', width: '100%', textAlign: 'left',
                  padding: '0.875rem 1.25rem', border: 'none', cursor: 'pointer',
                  background: activeChatId === chat.id ? 'var(--glass)' : 'transparent',
                  borderLeft: activeChatId === chat.id ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: chat.coverUrl ? `url(${chat.coverUrl}) center/cover` : 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!chat.coverUrl && (chat.type === 'universe' ? <Globe size={20} /> : chat.type === 'group' ? <Users size={20} /> : <User size={20} />)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: chat.isUnread ? 700 : 500 }}>{chat.title}</span>
                    {chat.isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                  </div>
                  {chat.latestMessage ? (
                    <div style={{ color: chat.isUnread ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: chat.isUnread ? 600 : 400 }}>
                      {chat.latestMessage.senderName}: {chat.latestMessage.content}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>No messages yet</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`msg-main ${!activeChatId ? 'hidden-mobile' : ''}`}>
        {activeChatId ? (
          <ChatBox chatId={activeChatId} title={activeChatTitle} onClose={() => setActiveChatId(null)} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
            <MessageCircle size={48} style={{ opacity: 0.5 }} />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Create Group Chat
              </h2>
              <button onClick={() => setShowCreateGroup(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Group Name</label>
                <input 
                  className="input" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)} 
                  placeholder="E.g. Adventure Party"
                  required 
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateGroup(false)} disabled={creatingGroup}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creatingGroup}>
                  {creatingGroup ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="spinner" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
