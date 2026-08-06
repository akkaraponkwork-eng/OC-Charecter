'use client';
import { Users } from 'lucide-react';

interface Relation {
  id: string;
  imageUrl: string;
  description: string;
}

interface RelationAvatarListProps {
  title: string;
  relations: Relation[];
}

export default function RelationAvatarList({ title, relations }: RelationAvatarListProps) {
  if (!relations || relations.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={20} /> {title}
      </h2>
      
      <div 
        className="hide-scrollbar" 
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: '1.25rem', 
          paddingBottom: '1rem',
          paddingTop: '0.5rem',
          scrollBehavior: 'smooth'
        }}
      >
        {relations.map((r) => (
          <div 
            key={r.id} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              minWidth: 100,
              maxWidth: 120,
              transition: 'transform 0.2s ease',
            }}
            className="avatar-hover"
          >
            <div 
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: r.imageUrl ? `url(${r.imageUrl}) center/cover` : 'var(--glass-border)',
                border: '2px solid rgba(14,165,233,0.5)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                marginBottom: '0.75rem',
                flexShrink: 0
              }} 
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {r.description || '-'}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .avatar-hover:hover {
          transform: translateY(-4px);
        }
        .avatar-hover:hover div {
          border-color: #0ea5e9 !important;
          box-shadow: 0 4px 14px rgba(14,165,233,0.4) !important;
        }
      `}</style>
    </div>
  );
}
