'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import ImageUpload from '@/components/ImageUpload';
import { User, AtSign, Camera, Pencil, Trash2, AlertTriangle, MessageCircle } from 'lucide-react';

export default function MyProfilePage() {
  const { data: session, update } = useSession();
  const { t } = useLocale();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [discord, setDiscord] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [toast, setToast] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/profile/me').then(r => r.json()).then(data => {
      setProfile(data);
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatarUrl || '');
      setTwitter(data.socialLinks?.twitter || '');
      setInstagram(data.socialLinks?.instagram || '');
      setDiscord(data.socialLinks?.discord || '');
      setIsPublic(data.isPublic ?? true);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/profile/me', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, bio, avatarUrl, socialLinks: { twitter, instagram, discord }, isPublic }),
    });
    await update({ avatarUrl, name: displayName });
    setSaving(false); setEditing(false);
    setToast(t('common.success'));
    setTimeout(() => setToast(''), 2500);
  };

  const handleDelete = async () => {
    await fetch('/api/profile/me', { method: 'DELETE' });
    window.location.href = '/';
  };

  if (!profile) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <User size={24} /> {t('profile.title')}
      </h1>

      <div className="glass" style={{ padding: '2rem' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          {editing ? (
            <ImageUpload onUploaded={setAvatarUrl} currentUrl={avatarUrl} size={90} />
          ) : (
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 700, color: 'white', border: '3px solid var(--glass-border)',
            }}>
              {!avatarUrl && (displayName || profile.username || '?')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            {editing ? (
              <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('profile.displayName')} style={{ marginBottom: '0.5rem' }} />
            ) : (
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{profile.displayName || profile.username}</h2>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>@{profile.username}</p>
            <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-pending'}`} style={{ marginTop: '0.25rem' }}>{profile.role}</span>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="label">{t('profile.bio')}</label>
          {editing ? (
            <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ resize: 'vertical' }} />
          ) : (
            <p style={{ color: bio ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
              {bio || '—'}
            </p>
          )}
        </div>

        {/* Social */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AtSign size={14} /> Twitter / <Camera size={14} /> Instagram / <MessageCircle size={14} /> Discord
          </label>
          {editing ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: 1, minWidth: 120 }} value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@twitter" />
              <input className="input" style={{ flex: 1, minWidth: 120 }} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@instagram" />
              <input className="input" style={{ flex: 1, minWidth: 120 }} value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="Discord link/ID" />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
              {profile.socialLinks?.twitter && <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AtSign size={14} /> {profile.socialLinks.twitter}</a>}
              {profile.socialLinks?.instagram && <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Camera size={14} /> {profile.socialLinks.instagram}</a>}
              {profile.socialLinks?.discord && <span style={{ color: '#5865F2', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MessageCircle size={14} /> {profile.socialLinks.discord}</span>}
              {!profile.socialLinks?.twitter && !profile.socialLinks?.instagram && !profile.socialLinks?.discord && <span style={{ color: 'var(--text-muted)' }}>—</span>}
            </div>
          )}
        </div>

        {/* Incognito Toggle (Admin Only) */}
        {profile.role === 'admin' && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
              <User size={14} /> Admin Visibility (Ghost Mode)
            </label>
            {editing ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                <span>Show my profile in Community (Public)</span>
              </label>
            ) : (
              <p style={{ color: isPublic ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPublic ? 'var(--success)' : 'var(--text-muted)' }} />
                {isPublic ? 'Public (Visible to everyone)' : 'Hidden (Incognito Mode)'}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {editing ? (
            <>
              <button className="btn-secondary" onClick={() => setEditing(false)} style={{ height: 44, padding: '0 1.5rem', flex: 1 }}>{t('common.cancel')}</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ height: 44, padding: '0 1.5rem', flex: 1 }}>
                {saving ? <><div className="spinner" />{t('profile.saving')}</> : t('profile.save')}
              </button>
            </>
          ) : (
            <button className="btn-secondary" onClick={() => setEditing(true)} style={{ height: 44, padding: '0 1.5rem', flex: 1 }}>
              <Pencil size={16} /> {t('profile.editProfile')}
            </button>
          )}
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)} style={{ height: 44, padding: '0 1.5rem', flex: 1 }}>
            <Trash2 size={16} /> {t('profile.deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> {t('profile.deleteAccount')}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{t('profile.deleteConfirm')}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>{t('common.cancel')}</button>
              <button className="btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
