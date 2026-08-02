'use client';
import { useState } from 'react';
import { useLocale } from '@/store/useLocale';
import ImageUpload from './ImageUpload';
import { FolderOpen } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: (universe: any) => void;
}

export default function CreateUniverseModal({ onClose, onCreated }: Props) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/universes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, coverUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderOpen size={20} /> {t('universe.create')}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">{t('universe.name')}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('universe.description')}</label>
            <textarea className="input" rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label">{t('universe.cover')}</label>
            <ImageUpload onUploaded={(url) => setCoverUrl(url)} currentUrl={coverUrl} />
          </div>
          {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" />{t('common.loading')}</> : t('universe.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
