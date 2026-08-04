'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, RefreshCw, FolderOpen, User as UserIcon } from 'lucide-react';
import { useLocale } from '@/store/useLocale';
import UniverseCard from '@/components/UniverseCard';
import CharacterCard from '@/components/CharacterCard';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'universes' | 'characters'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [universes, setUniverses] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLocale();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [usersRes, uniRes, charRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/community/universes').then(r => r.json()),
        fetch('/api/community/characters').then(r => r.json())
      ]);
      
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setUniverses(Array.isArray(uniRes) ? uniRes : []);
      setCharacters(Array.isArray(charRes) ? charRes : []);
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
          <Users size={32} className="text-primary" /> Community
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
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

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <Users size={18} /> Creators ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('universes')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'universes' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'universes' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <FolderOpen size={18} /> Universes ({universes.length})
        </button>
        <button 
          onClick={() => setActiveTab('characters')} 
          style={{ background: 'none', border: 'none', padding: '0.75rem 1rem', color: activeTab === 'characters' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'characters' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          <UserIcon size={18} /> Characters ({characters.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {activeTab === 'users' && (
            filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <p>No creators found.</p>
              </div>
            ) : (
              <div className="grid-cards">
                {filteredUsers.map((u) => (
                  <Link href={`/profile/${u.uid}`} key={u.uid} style={{ textDecoration: 'none' }}>
                    <div className="glass card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                        background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 700, color: 'white', border: '3px solid var(--glass-border)',
                      }}>
                        {!u.avatarUrl && (u.displayName?.[0] || u.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
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
            )
          )}

          {activeTab === 'universes' && (
            filteredUniverses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <FolderOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No universes found.</p>
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
                <p>No characters found.</p>
              </div>
            ) : (
              <div className="grid-cards">
                {filteredCharacters.map((char) => (
                  <CharacterCard key={char.id} character={char} hideDelete />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
