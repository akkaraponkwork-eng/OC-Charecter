'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import { useStore } from '@/store/useStore';
import CharacterCard from '@/components/CharacterCard';
import CharacterFormModal from '@/components/CharacterFormModal';
import CharacterAlbumStack from '@/components/CharacterAlbumStack';
import { Users, Plus, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function CharactersPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const { characters, setCharacters, addCharacter, updateCharacter, universes, setUniverses } = useStore();
  const [loading, setLoading] = useState(true);
  const [showAddChar, setShowAddChar] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/characters').then(r => r.json()),
      fetch('/api/universes').then(r => r.json())
    ]).then(([charData, uniData]) => {
      setCharacters(Array.isArray(charData) ? charData : []);
      setUniverses(Array.isArray(uniData) ? uniData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveCharacter = async (data: any) => {
    if (selectedCharacter) {
      // Edit
      const res = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        updateCharacter(selectedCharacter.id, data);
        setShowAddChar(false);
        setSelectedCharacter(null);
      }
    } else {
      // Create
      const res = await fetch('/api/characters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newChar = await res.json();
      if (res.ok) {
        addCharacter(newChar);
        setShowAddChar(false);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} className="text-primary" /> My Characters
        </h1>
        <button className="btn-primary" onClick={() => { setSelectedCharacter(null); setShowAddChar(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Create Character
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        </div>
      ) : characters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>You haven't created any characters yet.</p>
          <button className="btn-primary" onClick={() => setShowAddChar(true)} style={{ marginTop: '1rem' }}>
            Create First Character
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {(() => {
            const groupedCharacters: { [key: string]: any[] } = {};
            const singleCharacters: any[] = [];
            
            characters.forEach((c: any) => {
              const primaryUniverse = c.universeIds?.[0];
              if (primaryUniverse) {
                if (!groupedCharacters[primaryUniverse]) groupedCharacters[primaryUniverse] = [];
                groupedCharacters[primaryUniverse].push(c);
              } else {
                singleCharacters.push(c);
              }
            });

            const albums: { universe: any, chars: any[] }[] = [];
            
            Object.keys(groupedCharacters).forEach(uid => {
              const chars = groupedCharacters[uid];
              const universe = universes.find((u: any) => u.id === uid);
              if (chars.length > 1 && universe) {
                albums.push({ universe, chars });
              } else {
                chars.forEach((c: any) => singleCharacters.push(c));
              }
            });

            return (
              <>
                {albums.map((album) => (
                  <CharacterAlbumStack 
                    key={`album-${album.universe.id}`} 
                    universe={album.universe} 
                    characters={album.chars} 
                    href={`/universes/${album.universe.id}`} 
                  />
                ))}
                {singleCharacters.map((c: any) => (
                  <div key={c.id} style={{ position: 'relative' }}>
                    <CharacterCard character={c} />
                    <button
                      onClick={() => { setSelectedCharacter(c); setShowAddChar(true); }}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* Add/Edit Character Modal */}
      <CharacterFormModal
        isOpen={showAddChar}
        onClose={() => { setShowAddChar(false); setSelectedCharacter(null); }}
        onSubmit={handleSaveCharacter}
        initialData={selectedCharacter}
      />
    </div>
  );
}
