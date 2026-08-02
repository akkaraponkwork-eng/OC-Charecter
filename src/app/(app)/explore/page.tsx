'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Compass } from 'lucide-react';
import { useLocale } from '@/store/useLocale';

export default function ExplorePage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLocale();

  const fetchExploreFeed = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/explore/characters');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch explore feed:', error);
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchExploreFeed();
  }, []);

  return (
    <div className="page-container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Compass size={32} className="text-primary" /> Explore
        </h1>
        <button 
          onClick={fetchExploreFeed}
          disabled={refreshing || loading}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '99px' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          Shuffle Feed
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : characters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>No public character artworks found.</p>
        </div>
      ) : (
        <div style={{
          columnCount: 1,
          columnGap: '1.5rem',
        }} className="masonry-grid">
          <style dangerouslySetInnerHTML={{__html: `
            .masonry-grid { column-count: 1; }
            @media (min-width: 640px) { .masonry-grid { column-count: 2; } }
            @media (min-width: 1024px) { .masonry-grid { column-count: 3; } }
            @media (min-width: 1280px) { .masonry-grid { column-count: 4; } }
            @media (min-width: 1536px) { .masonry-grid { column-count: 5; } }
            .masonry-item {
              break-inside: avoid;
              margin-bottom: 1.5rem;
              position: relative;
              border-radius: var(--radius-lg);
              overflow: hidden;
              background: var(--glass-bg);
              border: 1px solid var(--glass-border);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .masonry-item:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            .masonry-item img {
              width: 100%;
              display: block;
              object-fit: cover;
            }
            .masonry-overlay {
              position: absolute;
              bottom: 0; left: 0; right: 0;
              padding: 1.5rem 1rem 1rem;
              background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
              opacity: 0;
              transition: opacity 0.2s;
              pointer-events: none;
            }
            .masonry-item:hover .masonry-overlay {
              opacity: 1;
            }
          `}} />
          {characters.map((char) => (
            <Link href={`/characters/${char.id}`} key={char.id} className="masonry-item" style={{ display: 'block', textDecoration: 'none' }}>
              <img src={char.imageUrl} alt={char.name} loading="lazy" />
              <div className="masonry-overlay">
                <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                  {char.name}
                </div>
                {char.bio && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {char.bio}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
