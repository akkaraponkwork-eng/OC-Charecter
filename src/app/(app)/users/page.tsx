'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, RefreshCw, FolderOpen, User as UserIcon, Send, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import UniverseCard from '@/components/UniverseCard';
import CharacterCard from '@/components/CharacterCard';
import CharacterAlbumStack from '@/components/CharacterAlbumStack';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'universes' | 'characters' | 'socials'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [universes, setUniverses] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const { data: session } = useSession();
  const currentUser = session?.user as any;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLocale();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [usersRes, uniRes, charRes, socialRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/community/universes', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/community/characters', { cache: 'no-store' }).then(r => r.json()),
        fetch(`/api/messages?chatId=social_board&t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json())
      ]);
      
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setUniverses(Array.isArray(uniRes) ? uniRes : []);
      setCharacters(Array.isArray(charRes) ? charRes : []);
      setSocialPosts(Array.isArray(socialRes) ? socialRes.reverse() : []); // newest first
    } catch (error) {
      console.error('Failed to fetch community data:', error);
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: 'social_board', content: newPostContent.trim() })
      });
      if (res.ok) {
        const newPost = await res.json();
        setNewPostContent('');
        // Add immediately to top without full refresh
        setSocialPosts(prev => [newPost, ...prev]);
      }
    } catch (error) {
      console.error(error);
    }
    setPosting(false);
  };

  const handleEditSubmit = async (id: string) => {
    if (!editingContent.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent.trim() })
      });
      if (res.ok) {
        setSocialPosts(posts => posts.map(p => p.id === id ? { ...p, content: editingContent.trim() } : p));
        setEditingPostId(null);
      }
    } catch (error) {
      console.error(error);
    }
    setSavingEdit(false);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm(t('common.delete') + '?')) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSocialPosts(posts => posts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const parseLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => 
      urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>{part}</a> : part
    );
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUniverses = universes.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCharacters = characters.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} className="text-primary" /> {t('community.title') || 'Community'}
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={`${t('community.search') || 'Search'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '20px', border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', width: '250px' }}
            />
          </div>
          <button 
            onClick={fetchData}
            disabled={refreshing || loading}
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '99px' }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <Users size={18} /> {t('community.creatorsTab') || 'Creators'} ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('universes')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'universes' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'universes' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <FolderOpen size={18} /> {t('community.universesTab') || 'Universes'} ({universes.length})
        </button>
        <button 
          onClick={() => setActiveTab('characters')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'characters' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'characters' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <UserIcon size={18} /> {t('community.charactersTab') || 'Characters'} ({characters.length})
        </button>
        <button 
          onClick={() => setActiveTab('socials')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'socials' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'socials' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <Users size={18} /> {t('community.socialsTab') || 'หาเพื่อน & แลกโซเชียล'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {activeTab === 'users' && (
            <>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <p>{t('community.noCreators') || 'No creators found.'}</p>
                </div>
              ) : (
                <div className="grid-cards">
                  {filteredUsers.map((u) => (
                    <Link href={`/profile/${u.uid}`} key={u.uid} style={{ textDecoration: 'none' }}>
                      <div className="glass card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{
                            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                            background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 700, color: 'white', border: '3px solid var(--glass-border)',
                          }}>
                            {!u.avatarUrl && (u.displayName?.[0] || u.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div style={{
                            position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%',
                            background: u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt).getTime() < 10 * 60 * 1000) ? '#10b981' : '#ef4444',
                            border: '2px solid var(--bg-main)'
                          }} title={u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt).getTime() < 10 * 60 * 1000) ? 'Online' : 'Offline'} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }} className={u.role === 'admin' ? 'text-role-admin' : 'text-role-user'}>
                            {u.displayName || u.username}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{u.username}</p>
                        </div>
                        {u.bio && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'universes' && (
            filteredUniverses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <FolderOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>{t('community.noUniverses') || 'No universes found.'}</p>
              </div>
            ) : (
              <div className="grid-cards">
                {filteredUniverses.map((uni) => (
                  <UniverseCard key={uni.id} universe={uni} />
                ))}
              </div>
            )
          )}

          {activeTab === 'characters' && (
            filteredCharacters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <UserIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>{t('community.noCharacters') || 'No characters found.'}</p>
              </div>
            ) : (
              <div className="grid-cards">
                {(() => {
                  const groupedCharacters: { [key: string]: any[] } = {};
                  const singleCharacters: any[] = [];
                  
                  filteredCharacters.forEach((c: any) => {
                    const primaryUniverse = c.universeIds?.[0];
                    if (primaryUniverse) {
                      if (!groupedCharacters[primaryUniverse]) groupedCharacters[primaryUniverse] = [];
                      groupedCharacters[primaryUniverse].push(c);
                    } else {
                      singleCharacters.push(c);
                    }
                  });

                  const albums: { universe: any, chars: any[] }[] = [];
                  
                  Object.keys(groupedCharacters).forEach(uid => {
                    const chars = groupedCharacters[uid];
                    const universe = universes.find((u: any) => u.id === uid);
                    if (chars.length > 1 && universe) {
                      albums.push({ universe, chars });
                    } else {
                      chars.forEach((c: any) => singleCharacters.push(c));
                    }
                  });

                  return (
                    <>
                      {albums.map((album) => (
                        <CharacterAlbumStack 
                          key={`album-${album.universe.id}`} 
                          universe={album.universe} 
                          characters={album.chars} 
                          href={`/share/universe/${album.universe.id}`} 
                        />
                      ))}
                      {singleCharacters.map((char) => (
                        <CharacterCard key={char.id} character={char} hideDelete />
                      ))}
                    </>
                  );
                })()}
              </div>
            )
          )}

          {activeTab === 'socials' && (
            <div style={{ padding: '0 0.5rem', maxWidth: 800, margin: '0 auto' }}>
              <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(236, 72, 153, 0.1))', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🤝 {t('community.socialsTitle') || 'หาเพื่อน แลกไอดี และร่วมคอลแลป!'}
                </h2>
                
                {currentUser ? (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                      background: currentUser?.avatarUrl || currentUser?.image ? `url(${currentUser.avatarUrl || currentUser.image}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', fontWeight: 700, color: 'white', border: '2px solid var(--glass-border)',
                    }}>
                      {!(currentUser?.avatarUrl || currentUser?.image) && (currentUser?.name?.[0] || currentUser?.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <textarea 
                        placeholder="เขียนแนะนำตัว ฝากช่องทางติดต่อ หรือแปะลิ้งก์ที่นี่..."
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        style={{
                          width: '100%', minHeight: '80px', padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                          border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)',
                          resize: 'vertical', fontSize: '0.9rem', outline: 'none', marginBottom: '0.5rem'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={handlePostSubmit} 
                          disabled={posting || !newPostContent.trim()}
                          className="btn-primary" 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '99px', opacity: (!newPostContent.trim() || posting) ? 0.5 : 1 }}
                        >
                          <Send size={14} /> โพสต์
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>กรุณาเข้าสู่ระบบเพื่อโพสต์แนะนำตัวและแปะลิ้งก์ของคุณ</p>
                    <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1.25rem', borderRadius: '99px', textDecoration: 'none' }}>
                      เข้าสู่ระบบ
                    </Link>
                  </div>
                )}
              </div>

              {socialPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>{t('community.emptySocials') || 'ยังไม่มีใครโพสต์แนะนำตัวเลย มาเริ่มเป็นคนแรกสิ!'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {socialPosts.map((post) => {
                    const isAuthor = currentUser?.uid === post.senderId || currentUser?.role === 'admin';
                    return (
                      <div key={post.id} className="glass card-hover" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
                        {isAuthor && editingPostId !== post.id && (
                          <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => { setEditingPostId(post.id); setEditingContent(post.content); }} 
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                              title={t('common.edit') || 'แก้ไข'}
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeletePost(post.id)} 
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                              title={t('common.delete') || 'ลบ'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <Link href={`/profile/${post.senderId}`} style={{ textDecoration: 'none' }}>
                            <div style={{ position: 'relative' }}>
                              <div style={{
                                width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                                background: post.senderAvatar ? `url(${post.senderAvatar}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem', fontWeight: 700, color: 'white', border: '2px solid var(--glass-border)',
                              }}>
                                {!post.senderAvatar && (post.senderName?.[0] || '?').toUpperCase()}
                              </div>
                              {/* Find user to check online status */}
                              {(() => {
                                const postUser = users.find(u => u.uid === post.senderId);
                                const isOnline = postUser?.lastActiveAt && (Date.now() - new Date(postUser.lastActiveAt).getTime() < 10 * 60 * 1000);
                                return postUser ? (
                                  <div style={{
                                    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%',
                                    background: isOnline ? '#10b981' : '#ef4444',
                                    border: '2px solid var(--bg-main)'
                                  }} title={isOnline ? 'Online' : 'Offline'} />
                                ) : null;
                              })()}
                            </div>
                          </Link>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <Link href={`/profile/${post.senderId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                                  {post.senderName}
                                </h3>
                              </Link>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                {new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {editingPostId === post.id ? (
                              <div style={{ marginBottom: '1rem' }}>
                                <textarea 
                                  value={editingContent}
                                  onChange={e => setEditingContent(e.target.value)}
                                  style={{
                                    width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: 'var(--radius)',
                                    border: '1px solid var(--primary)', background: 'var(--bg-elevated)', color: 'var(--text-main)',
                                    resize: 'vertical', fontSize: '0.9rem', outline: 'none', marginBottom: '0.5rem'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    onClick={() => handleEditSubmit(post.id)}
                                    disabled={savingEdit || !editingContent.trim()}
                                    className="btn-primary"
                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px' }}
                                  >
                                    {t('common.save') || 'บันทึก'}
                                  </button>
                                  <button 
                                    onClick={() => setEditingPostId(null)}
                                    disabled={savingEdit}
                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}
                                  >
                                    {t('common.cancel') || 'ยกเลิก'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1rem' }}>
                                {parseLinks(post.content)}
                              </div>
                            )}
                            
                            <div style={{ display: 'flex' }}>
                              <Link href={`/messages?userId=${post.senderId}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                                {t('profile.sendMessage') || 'ส่งข้อความ'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
