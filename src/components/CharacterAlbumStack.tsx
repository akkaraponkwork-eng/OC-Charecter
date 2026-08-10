'use client';
import Link from 'next/link';
import { useLocale } from '@/store/useLocale';
import { Layers, Handshake } from 'lucide-react';

interface CharacterAlbumStackProps {
  universe: any;
  characters: any[];
  href: string;
}

export default function CharacterAlbumStack({ universe, characters, href }: CharacterAlbumStackProps) {
  const { t } = useLocale();
  
  // Show max 3 cards in the stack
  const displayChars = characters.slice(0, 3).reverse();
  const coverImage = universe?.coverUrl || characters[0]?.imageUrl || '';

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative', height: '100%', minHeight: 330 }}>
        {displayChars.map((c, i, arr) => {
          const isTop = i === arr.length - 1;
          const offset = (arr.length - 1 - i) * 10;
          const scale = 1 - ((arr.length - 1 - i) * 0.05);
          
          return (
            <div 
              key={c.id} 
              style={{
                position: isTop ? 'relative' : 'absolute',
                top: isTop ? 0 : offset,
                left: isTop ? 0 : offset / 2,
                right: isTop ? 0 : offset / 2,
                zIndex: i,
                opacity: 1 - ((arr.length - 1 - i) * 0.2),
                transform: `scale(${scale})`,
                transformOrigin: 'bottom center',
                transition: 'all 0.3s ease',
                height: isTop ? '100%' : 'calc(100% - 20px)'
              }}
            >
              {isTop ? (
                <div className="glass card-hover" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {universe?.isCollaborator && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fbbf24', border: '1px solid #fbbf24', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem', backdropFilter: 'blur(4px)' }}>
                      <Handshake size={14} /> Collab
                    </div>
                  )}
                  <div style={{
                    height: 200, 
                    background: coverImage ? `url(${coverImage}) center/cover` : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))',
                    position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.95), transparent 70%)' }} />
                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         <Layers size={16} /> {universe?.name || 'Unknown Album'}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        {characters.length} Characters in Album
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem', flex: 1 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Click to view all characters in this universe.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {characters.slice(0, 5).map(char => (
                        <div key={char.id} title={char.name} style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: char.imageUrl ? `url(${char.imageUrl}) center/cover` : 'var(--primary)',
                          border: '2px solid rgba(255,255,255,0.1)'
                        }} />
                      ))}
                      {characters.length > 5 && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', color: 'var(--text-muted)'
                        }}>+{characters.length - 5}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: '100%', borderRadius: 'var(--radius-md)', background: 'rgba(20, 20, 30, 0.9)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} />
              )}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
