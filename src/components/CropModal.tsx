'use client';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { useLocale } from '@/store/useLocale';
import { Scissors } from 'lucide-react';

interface Props {
  imageSrc: string;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

export default function CropModal({ imageSrc, onCropComplete, onCancel }: Props) {
  const { t } = useLocale();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }}>
        
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scissors size={18} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Crop Image</h2>
        </div>

        <div style={{ position: 'relative', width: '100%', height: 350, background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onCancel} disabled={loading}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" onClick={handleCrop} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Crop & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
