'use client';
import { useEffect, useState } from 'react';
import { useLocale } from '@/store/useLocale';
import { useRouter } from 'next/navigation';
import { generateDmChatId } from '@/lib/auth-helpers';
import { useSession } from 'next-auth/react';
import { Lock, MessageCircle, AtSign, Camera, FolderOpen, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/store/useToast';
import { use } from 'react';

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid: pageUid } = use(params);
  const { t } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [checkingFriend, setCheckingFriend] = useState(true);
  const [updatingFriend, setUpdatingFriend] = useState(false);
  const myUid = (session?.user as any)?.uid;

  useEffect(() => {
    fetch(`/api/profile/${pageUid}`).then(r => {
      if (r.ok) return r.json();
      throw new Error('Not found');
    }).then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [pageUid]);

  useEffect(() => {
    if (myUid && myUid !== pageUid) {
      fetch('/api/friends').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setIsFriend(data.some((f: any) => f.uid === pageUid));
        }
        setCheckingFriend(false);
      });
    } else {
      setCheckingFriend(false);
    }
  }, [myUid, pageUid]);

  const handleAddFriend = async () => {
    if (!profile) return;
    setUpdatingFriend(true);
    const res = await fetch('/api/friends', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username })
    });
    setUpdatingFriend(false);
    if (res.ok) {
      setIsFriend(true);
      showToast('Friend added successfully!', 'success');
    } else {
      showToast('Failed to add friend', 'error');
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    setUpdatingFriend(true);
    const res = await fetch(`/api/friends?friendId=${pageUid}`, { method: 'DELETE' });
    setUpdatingFriend(false);
    if (res.ok) {
      setIsFriend(false);
      showToast('Friend removed', 'info');
    } else {
      showToast('Failed to remove friend', 'error');
    }
  };

  const handleDM = () => {
    if (!myUid) return;
    const chatId = [myUid, pageUid].sort().join('_');
    router.push(`/messages?chatId=${chatId}`);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (!profile) return <div className="page-container"><div className="glass" style={{ padding: '2rem', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Lock size={16} /> This profile is private.</p></div></div>;

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: profile.avatarUrl ? `url(${profile.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: 'white', border: '3px solid var(--glass-border)',
          }}>
            {!profile.avatarUrl && (profile.displayName || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profile.displayName}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>@{profile.username}</p>
            {profile.bio && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>{profile.bio}</p>}
          </div>
          {myUid && myUid !== pageUid && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={handleDM} style={{ whiteSpace: 'nowrap', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageCircle size={14} /> {t('profile.sendMessage')}
              </button>
              {!checkingFriend && (
                isFriend ? (
                  <button className="btn-danger" onClick={handleRemoveFriend} disabled={updatingFriend} style={{ whiteSpace: 'nowrap', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {updatingFriend ? <Loader2 size={14} className="spin" /> : <UserMinus size={14} />} Remove Friend
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleAddFriend} disabled={updatingFriend} style={{ whiteSpace: 'nowrap', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {updatingFriend ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />} Add Friend
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Social */}
        {(profile.socialLinks?.twitter || profile.socialLinks?.instagram) && (
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            {profile.socialLinks?.twitter && <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AtSign size={14} /> @{profile.socialLinks.twitter}</a>}
            {profile.socialLinks?.instagram && <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Camera size={14} /> @{profile.socialLinks.instagram}</a>}
          </div>
        )}
      </div>

      {/* Public Universes */}
      {profile.publicUniverses?.length > 0 && (
        <>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FolderOpen size={16} /> Universes</h2>
          <div className="grid-cards">
            {profile.publicUniverses.map((u: any) => (
              <a key={u.id} href={`/share/universe/${u.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass card-hover" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', flexShrink: 0, background: u.coverUrl ? `url(${u.coverUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))' }} />
                  <span style={{ fontWeight: 600 }}>{u.name}</span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
