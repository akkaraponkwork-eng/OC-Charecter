'use client';
import Link from 'next/link';
import { Users } from 'lucide-react';

interface FeaturedCharacter {
  id: string;
  name: string;
  imageUrl?: string;
  role?: string;
}

interface FeaturedAvatarListProps {
  title: string;
  characters: FeaturedCharacter[];
  prefix?: string; // used for /share paths
}

export default function FeaturedAvatarList({ title, characters, prefix = '' }: FeaturedAvatarListProps) {
  if (!characters || characters.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
        <Users size={18} /> {title}
      </h3>
      
      <div 
        className="hide-scrollbar" 
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: '1.25rem', 
          paddingBottom: '0.5rem',
          paddingTop: '0.5rem',
          scrollBehavior: 'smooth'
        }}
      >
        {characters.map((c) => (
          <Link 
            key={c.id} 
            href={`${prefix}/characters/${c.id}`} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              minWidth: 85,
              textDecoration: 'none',
              transition: 'transform 0.2s ease',
            }}
            className="avatar-hover"
          >
            <div 
              style={{ 
                width: 72, 
                height: 72, 
                borderRadius: '50%', 
                background: c.imageUrl ? `url(${c.imageUrl}) center/cover` : 'var(--glass-border)',
                border: '2px solid rgba(124,58,237,0.5)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                marginBottom: '0.5rem'
              }} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.2 }}>
              {c.name}
            </span>
            {c.role && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {c.role}
              </span>
            )}
          </Link>
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .avatar-hover:hover {
          transform: translateY(-4px);
        }
        .avatar-hover:hover div {
          border-color: var(--primary) !important;
          box-shadow: 0 4px 14px rgba(124,58,237,0.4) !important;
        }
      `}</style>
    </div>
  );
}
