'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/store/useToast';
import { Search, UserPlus, UserMinus, User, Users, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/store/useLocale';

export default function FriendsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { t } = useLocale();

  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [publicData, setPublicData] = useState<any>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);

  useEffect(() => {
    if (session) {
      loadFriends();
    }
  }, [session]);

  const loadFriends = async () => {
    setLoading(true);
    const res = await fetch('/api/friends');
    if (res.ok) {
      const data = await res.json();
      setFriends(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAdding(true);
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: searchQuery.trim() })
    });

    const data = await res.json();
    setAdding(false);

    if (res.ok) {
      showToast('Friend added successfully!', 'success');
      setSearchQuery('');
      loadFriends();
    } else {
      showToast(data.error || 'Failed to add friend', 'error');
    }
  };

  const handleRemoveFriend = async (uid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to remove this friend?')) return;

    const res = await fetch(`/api/friends?friendId=${uid}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Friend removed', 'info');
      setFriends(friends.filter(f => f.uid !== uid));
      if (selectedUser?.profile?.uid === uid) {
        setSelectedUser(null);
      }
    } else {
      showToast('Failed to remove friend', 'error');
    }
  };

  const openProfile = async (username: string) => {
    setLoadingPublic(true);
    const res = await fetch(`/api/users/${username}/public`);
    if (res.ok) {
      const data = await res.json();
      setSelectedUser(data);
    } else {
      const errorData = await res.json();
      showToast(errorData.error || 'Failed to load profile', 'error');
    }
    setLoadingPublic(false);
  };

  if (loading) {
    return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;
  }

  if (selectedUser) {
    return (
      <div className="page-container">
        <button onClick={() => setSelectedUser(null)} className="btn-secondary" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Friends
        </button>

        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: selectedUser.profile.avatarUrl ? `url(${selectedUser.profile.avatarUrl}) center/cover` : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
            {!selectedUser.profile.avatarUrl && selectedUser.profile.displayName?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{selectedUser.profile.displayName}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>@{selectedUser.profile.username}</p>
            <p style={{ color: 'var(--text-main)', lineHeight: 1.5, maxWidth: '600px' }}>{selectedUser.profile.bio || 'No bio provided.'}</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Public Universes ({selectedUser.universes.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {selectedUser.universes.map((uni: any) => (
            <Link href={`/universes/${uni.id}`} key={uni.id} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%' }}>
                <div style={{ height: 140, background: uni.imageUrl ? `url(${uni.imageUrl}) center/cover` : 'var(--glass-border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{uni.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{uni.description}</p>
              </div>
            </Link>
          ))}
          {selectedUser.universes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No public universes.</p>}
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Public Characters ({selectedUser.characters.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {selectedUser.characters.map((char: any) => (
            <Link href={`/characters/${char.id}`} key={char.id} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%', textAlign: 'center' }}>
                <div style={{ width: 100, height: 100, margin: '0 auto 1rem', borderRadius: '50%', background: char.imageUrl ? `url(${char.imageUrl}) center/cover` : 'var(--glass-border)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{char.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{char.shortDescription}</p>
              </div>
            </Link>
          ))}
          {selectedUser.characters.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No public characters.</p>}
        </div>

      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} className="text-primary" /> Friends
        </h1>
      </div>

      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add a Friend</h2>
        <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Enter exact username..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={adding} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {adding ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
            Add
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Friends ({friends.length})</h2>
      
      {loadingPublic && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><div className="spinner" /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {friends.map(friend => (
          <div 
            key={friend.uid} 
            className="glass-card" 
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
            onClick={() => openProfile(friend.username)}
          >
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: friend.avatarUrl ? `url(${friend.avatarUrl}) center/cover` : 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
              {!friend.avatarUrl && (friend.displayName || friend.username).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.displayName || friend.username}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{friend.username}</div>
            </div>
            <button 
              onClick={(e) => handleRemoveFriend(friend.uid, e)} 
              className="btn-danger" 
              style={{ padding: '0.5rem', borderRadius: '50%' }}
              title="Remove friend"
            >
              <UserMinus size={16} />
            </button>
          </div>
        ))}
      </div>

      {!loading && friends.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)' }}>
          <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem' }}>You haven't added any friends yet.</p>
          <p style={{ fontSize: '0.9rem' }}>Search for a username above to get started!</p>
        </div>
      )}
    </div>
  );
}
