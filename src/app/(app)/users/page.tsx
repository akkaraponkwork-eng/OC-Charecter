'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, RefreshCw, FolderOpen, User as UserIcon, Send, Trash2, MessageCircle, Edit3 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import UniverseCard from '@/components/UniverseCard';
import CharacterCard from '@/components/CharacterCard';
import CharacterAlbumStack from '@/components/CharacterAlbumStack';
import ImageUpload from '@/components/ImageUpload';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'universes' | 'characters' | 'socials'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [universes, setUniverses] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingImage, setEditingImage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t, locale } = useLocale();

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
      setSocialPosts(Array.isArray(socialRes) ? socialRes.reverse() : []);
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
    if (!newPostContent.trim() && !newPostImage) return;
    setPosting(true);
    try {
      const finalContent = newPostImage ? `${newPostContent.trim()}\n||IMG||\n${newPostImage}` : newPostContent.trim();
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: 'social_board', content: finalContent })
      });
      if (res.ok) {
        const newPost = await res.json();
        setNewPostContent('');
        setNewPostImage('');
        setSocialPosts(prev => [newPost, ...prev]);
      }
    } catch (error) {
      console.error(error);
    }
    setPosting(false);
  };

  const handleEditSubmit = async (id: string) => {
    if ((!editingContent.trim() && !editingImage) || savingEdit) return;
    setSavingEdit(true);
    try {
      const finalContent = editingImage ? `${editingContent.trim()}\n||IMG||\n${editingImage}` : editingContent.trim();
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalContent })
      });
      if (res.ok) {
        setSocialPosts(posts => posts.map(p => p.id === id ? { ...p, content: finalContent } : p));
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
    const parts = text.split('\n||IMG||\n');
    const textContent = parts[0] || '';
    const imageUrl = parts[1] || '';
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const renderedText = textContent.split(urlRegex).map((part, i) => 
      urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>{part}</a> : part
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)' }}>{renderedText}</div>
        {imageUrl && (
          <img src={imageUrl} alt="attachment" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }} />
        )}
      </div>
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
          <MessageCircle size={18} /> หาเพื่อน & แนะนำตัว
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>พื้นที่หาเพื่อน & แนะนำตัว</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>แนะนำตัวให้ทุกคนรู้จัก หรือตามหาเพื่อนร่วมแต่งเนื้อเรื่องได้ที่นี่เลย!</p>
                <textarea
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  placeholder="พิมพ์ข้อความแนะนำตัว หรือ โพสต์หาเพื่อน..."
                  style={{ width: '100%', minHeight: 100, padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', resize: 'vertical' }}
                />
                
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>แนบรูปภาพ (ตัวเลือก)</p>
                  <ImageUpload onUploaded={url => setNewPostImage(url)} currentUrl={newPostImage} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handlePostSubmit}
                    disabled={(!newPostContent.trim() && !newPostImage) || posting}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.5rem', borderRadius: '99px', opacity: ((!newPostContent.trim() && !newPostImage) || posting) ? 0.5 : 1 }}
                  >
                    {posting ? 'กำลังโพสต์...' : 'โพสต์'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {socialPosts.map(post => (
                  <div key={post.id} className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <Link href={`/profile/${post.senderId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: post.senderAvatar ? `url(${post.senderAvatar}) center/cover` : 'var(--primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{post.senderName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{new Date(post.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</div>
                        </div>
                      </Link>
                      {(currentUser?.uid === post.senderId || currentUser?.role === 'admin') && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => { 
                            const parts = post.content.split('\n||IMG||\n');
                            setEditingPostId(post.id); 
                            setEditingContent(parts[0] || ''); 
                            setEditingImage(parts[1] || '');
                          }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                          <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    
                    {editingPostId === post.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <textarea value={editingContent} onChange={e => setEditingContent(e.target.value)} style={{ width: '100%', minHeight: 80, padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--bg-main)', border: '1px solid var(--primary)', color: 'var(--text-main)', resize: 'vertical' }} />
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>เปลี่ยนรูปภาพ</p>
                          <ImageUpload onUploaded={url => setEditingImage(url)} currentUrl={editingImage} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => setEditingPostId(null)} className="btn-secondary" style={{ padding: '0.25rem 1rem', borderRadius: '99px' }}>ยกเลิก</button>
                          <button onClick={() => handleEditSubmit(post.id)} className="btn-primary" disabled={savingEdit || (!editingContent.trim() && !editingImage)} style={{ padding: '0.25rem 1rem', borderRadius: '99px' }}>บันทึก</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {parseLinks(post.content)}
                      </div>
                    )}
                  </div>
                ))}
                
                {socialPosts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <MessageCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>ยังไม่มีโพสต์หาเพื่อน เริ่มพิมพ์แนะนำตัวเป็นคนแรกเลย!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
