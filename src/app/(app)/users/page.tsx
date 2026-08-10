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
  const [activeTab, setActiveTab] = useState<'users' | 'universes' | 'characters' | 'stories'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [universes, setUniverses] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLocale();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [usersRes, uniRes, charRes, storiesRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/community/universes', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/community/characters', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/stories', { cache: 'no-store' }).then(r => r.json())
      ]);
      
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setUniverses(Array.isArray(uniRes) ? uniRes : []);
      setCharacters(Array.isArray(charRes) ? charRes : []);
      setStories(Array.isArray(storiesRes) ? storiesRes : []);
    } catch (error) {
      console.error('Failed to fetch community data:', error);
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          onClick={() => setActiveTab('stories')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'stories' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'stories' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <FolderOpen size={18} /> {t('community.storiesTab') || 'สตอรี่ & สร้างโลก'} ({stories.length})
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

          {activeTab === 'stories' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Link href="/story/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '99px', padding: '0.5rem 1.25rem' }}>
                  <FolderOpen size={16} /> {t('community.createStory') || 'สร้างสตอรี่ใหม่'}
                </Link>
              </div>
              
              {stories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <FolderOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>{t('community.noStories') || 'ยังไม่มีใครสร้างสตอรี่เลย มาเริ่มแต่งเรื่องแรกกันเถอะ!'}</p>
                </div>
              ) : (
                <div className="grid-cards">
                  {stories.map(story => (
                    <Link href={`/story/${story.id}`} key={story.id} style={{ textDecoration: 'none' }}>
                      <div className="glass card-hover" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                        {story.coverImage && (
                          <div style={{ width: '100%', height: 160, borderRadius: 'var(--radius)', backgroundImage: `url(${story.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        )}
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{story.title}</h3>
                          {story.description && (
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                              {story.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
