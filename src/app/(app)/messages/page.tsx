'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import { useSearchParams } from 'next/navigation';
import ChatBox from '@/components/ChatBox';
import CreateGroupModal from '@/components/CreateGroupModal';
import ManageGroupModal from '@/components/ManageGroupModal';
import { MessageCircle, Globe, User, Users, Plus, Trash2, LogOut, Settings } from 'lucide-react';
import { useToast } from '@/store/useToast';

type TabType = 'dms' | 'groups' | 'public';

function MessagesContent() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const { showToast } = useToast();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dms');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [managingGroup, setManagingGroup] = useState<any>(null);
  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');
  const uid = (session?.user as any)?.uid;
  const isAdmin = (session?.user as any)?.role === 'admin';

  const fetchChats = () => {
    fetch('/api/chats').then(r => r.json()).then(chatsData => {
      if (!Array.isArray(chatsData)) return;
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

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [uid]);

  const openChat = (id: string, title: string) => {
    setActiveChatId(id);
    setActiveChatTitle(title);
    if (id === 'public') setActiveTab('public');
  };

  useEffect(() => {
    if (userIdFromUrl && uid) {
      const sortedIds = [uid, userIdFromUrl].sort();
      const expectedChatId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
      setActiveChatId(expectedChatId);
      setActiveChatTitle('Chat');
      setActiveTab('dms');
    }
  }, [userIdFromUrl, uid]);

  const deleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`ลบกลุ่ม "${groupName}" ใช่ไหม? ข้อความทั้งหมดในกลุ่มจะถูกลบด้วย`)) return;
    const res = await fetch('/api/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    });
    if (res.ok) {
      showToast(`ลบกลุ่ม "${groupName}" แล้ว`, 'success');
      if (activeChatId === groupId) setActiveChatId(null);
      fetchChats();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to delete group', 'error');
    }
  };

  const leaveGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`ออกจากกลุ่ม "${groupName}" ใช่ไหม?`)) return;
    const res = await fetch(`/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUid: uid }),
    });
    if (res.ok) {
      showToast(`ออกจากกลุ่ม "${groupName}" แล้ว`, 'success');
      if (activeChatId === groupId) setActiveChatId(null);
      fetchChats();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to leave group', 'error');
    }
  };

  // Split chats by type
  const dmChats = chats.filter(c => c.type === 'dm');
  const groupChats = chats.filter(c => c.type === 'group');
  const publicChat = chats.find(c => c.type === 'public');

  const tabStyle = (tab: TabType) => ({
    flex: 1, padding: '0.6rem 0.25rem', border: 'none', cursor: 'pointer',
    background: 'transparent', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.8rem',
    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
  });

  const renderChatItem = (chat: any) => {
    const isActive = activeChatId === chat.id;
    const isOwner = chat.ownerId === uid;
    return (
      <div
        key={chat.id}
        style={{
          display: 'flex', alignItems: 'center',
          background: isActive ? 'var(--glass)' : 'transparent',
          borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
          transition: 'background 0.15s',
        }}
      >
        <button
          onClick={() => {
            if (chat.latestMessage) {
              localStorage.setItem('lastRead_' + chat.id, new Date().toISOString());
              setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isUnread: false } : c));
            }
            openChat(chat.id, chat.title);
          }}
          style={{
            flex: 1, display: 'flex', gap: '0.75rem', textAlign: 'left',
            padding: '0.875rem 0.75rem 0.875rem 1.25rem', border: 'none', cursor: 'pointer',
            background: 'transparent', minWidth: 0,
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: chat.coverUrl ? `url(${chat.coverUrl}) center/cover` : 'var(--glass)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!chat.coverUrl && (
              chat.type === 'public' ? <Globe size={18} /> :
              chat.type === 'group' ? <Users size={18} /> : <User size={18} />
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: chat.isUnread ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {chat.title}
              </span>
              {chat.isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
            </div>
            {chat.latestMessage ? (
              <div style={{ color: chat.isUnread ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: chat.isUnread ? 600 : 400 }}>
                {chat.latestMessage.senderName}: {chat.latestMessage.content?.startsWith('[IMG]') ? '📷 รูปภาพ' : chat.latestMessage.content}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontStyle: 'italic' }}>ยังไม่มีข้อความ</div>
            )}
          </div>
        </button>

        {/* Group Actions */}
        {chat.type === 'group' && (
          <div style={{ display: 'flex', gap: '0.25rem', paddingRight: '0.75rem', flexShrink: 0 }}>
            {(isOwner || isAdmin) ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setManagingGroup(chat); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                  title="จัดการสมาชิกกลุ่ม"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGroup(chat.id, chat.title); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                  title="ลบกลุ่ม"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); leaveGroup(chat.id, chat.title); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                title="ออกจากกลุ่ม"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex' }}>
      {/* Sidebar */}
      <div className={`msg-sidebar ${activeChatId ? 'hidden-mobile' : ''}`}>
        {/* Sidebar Header with Tabs */}
        <div style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ padding: '0.875rem 1.25rem 0', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={18} /> {t('chat.title') || 'Messages'}
          </div>
          <div style={{ display: 'flex', padding: '0.5rem 0.5rem 0' }}>
            <button style={tabStyle('dms') as any} onClick={() => setActiveTab('dms')}>
              <User size={13} /> DMs
              {dmChats.filter(c => c.isUnread).length > 0 && (
                <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {dmChats.filter(c => c.isUnread).length}
                </span>
              )}
            </button>
            <button style={tabStyle('groups') as any} onClick={() => setActiveTab('groups')}>
              <Users size={13} /> กลุ่ม
              {groupChats.filter(c => c.isUnread).length > 0 && (
                <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {groupChats.filter(c => c.isUnread).length}
                </span>
              )}
            </button>
            <button style={tabStyle('public') as any} onClick={() => setActiveTab('public')}>
              <Globe size={13} /> สาธารณะ
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* DMs Tab */}
          {activeTab === 'dms' && (
            <>
              {dmChats.length === 0 ? (
                <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  ยังไม่มีการสนทนา<br />
                  <span style={{ fontSize: '0.75rem' }}>เริ่มแชทจากโปรไฟล์ผู้ใช้</span>
                </p>
              ) : (
                dmChats.map(chat => renderChatItem(chat))
              )}
            </>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <>
              <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Plus size={15} /> สร้างกลุ่มใหม่
                </button>
              </div>
              {groupChats.length === 0 ? (
                <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  ยังไม่มีกลุ่มแชท<br />
                  <span style={{ fontSize: '0.75rem' }}>กดสร้างกลุ่มใหม่ด้านบน</span>
                </p>
              ) : (
                groupChats.map(chat => renderChatItem(chat))
              )}
            </>
          )}

          {/* Public Tab */}
          {activeTab === 'public' && (
            <>
              {publicChat ? (
                <div>
                  <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                    🌐 แชทสาธารณะสำหรับทุกคน
                    {isAdmin && <span style={{ marginLeft: 6, color: 'var(--primary)', fontWeight: 600 }}>· คุณเป็น Admin</span>}
                  </div>
                  {renderChatItem(publicChat)}
                </div>
              ) : (
                <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>กำลังโหลด...</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`msg-main ${!activeChatId ? 'hidden-mobile' : ''}`}>
        {activeChatId ? (
          <ChatBox
            chatId={activeChatId}
            title={activeChatTitle}
            onClose={() => setActiveChatId(null)}
            isPublic={activeChatId === 'public'}
            isAdmin={isAdmin}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
            <MessageCircle size={48} style={{ opacity: 0.3 }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '0.25rem' }}>เลือกการสนทนาเพื่อเริ่มแชท</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={(group) => {
            fetchChats();
            setActiveChatId(group.id);
            setActiveChatTitle(group.name);
            setActiveTab('groups');
          }}
        />
      )}

      {/* Manage Group Modal */}
      {managingGroup && (
        <ManageGroupModal
          chat={managingGroup}
          onClose={() => setManagingGroup(null)}
          onUpdated={() => {
            fetchChats();
          }}
        />
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
