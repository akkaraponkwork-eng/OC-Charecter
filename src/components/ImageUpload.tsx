'use client';
import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useLocale } from '@/store/useLocale';
import { Camera, Pencil } from 'lucide-react';
import CropModal from './CropModal';

interface Props {
  onUploaded: (url: string) => void;
  currentUrl?: string;
  size?: number; // px for the preview circle/square
}

export default function ImageUpload({ onUploaded, currentUrl, size = 120 }: Props) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const [cropImageSrc, setCropImageSrc] = useState('');

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result?.toString() || '');
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCropComplete = async (file: File) => {
    setCropImageSrc('');
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true,
      });
      const formData = new FormData();
      formData.append('image', compressed);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) { setPreview(data.url); onUploaded(data.url); }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
    <div
      onClick={() => !uploading && !cropImageSrc && inputRef.current?.click()}
      style={{
        width: size, height: size, borderRadius: 'var(--radius)',
        border: '2px dashed var(--glass-border)',
        background: preview ? `url(${preview}) center/cover` : 'var(--glass)',
        cursor: uploading ? 'wait' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-light)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
    >
      {uploading ? (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : !preview ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem' }}>
          <div style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}><Camera size={24} /></div>
          <div>Upload</div>
        </div>
      ) : (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(10,10,15,0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,10,15,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10,10,15,0)')}
        >
          <span style={{ opacity: 0, display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          ><Pencil size={20} color="white" /></span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
      />
    </div>
    
    {cropImageSrc && (
      <CropModal
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={() => setCropImageSrc('')}
      />
    )}
    </>
  );
}
