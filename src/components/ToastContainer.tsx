'use client';
import { useToast } from '@/store/useToast';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 9999,
      pointerEvents: 'none',
      maxWidth: '100%',
      padding: '0 1rem'
    }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              pointerEvents: 'auto',
              minWidth: 300,
              backdropFilter: 'blur(12px)',
            }}
          >
            {toast.type === 'success' && <CheckCircle size={20} color="#34d399" />}
            {toast.type === 'error' && <XCircle size={20} color="#f87171" />}
            {toast.type === 'info' && <Info size={20} color="#60a5fa" />}
            
            <p style={{ flex: 1, margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'white' }}>
              {toast.message}
            </p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem'
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
