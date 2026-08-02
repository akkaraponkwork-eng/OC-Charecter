'use client';
import { create } from 'zustand';

interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: 'user' | 'admin';
}

interface Universe {
  id: string;
  userId: string;
  name: string;
  description: string;
  coverUrl: string;
  isPublic: boolean;
  createdAt: string;
}

interface Character {
  id: string;
  userId: string;
  universeId: string;
  name: string;
  statsJSON: Record<string, number>;
  tags: string[];
  imageUrl: string;
  bio: string;
  isPublic: boolean;
  createdAt: string;
}

interface AppStore {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Universes
  universes: Universe[];
  setUniverses: (u: Universe[]) => void;
  addUniverse: (u: Universe) => void;
  updateUniverse: (id: string, data: Partial<Universe>) => void;
  removeUniverse: (id: string) => void;

  // Characters
  characters: Character[];
  setCharacters: (c: Character[]) => void;
  addCharacter: (c: Character) => void;
  updateCharacter: (id: string, data: Partial<Character>) => void;
  removeCharacter: (id: string) => void;

  // UI
  pendingInvitationCount: number;
  setPendingInvitationCount: (n: number) => void;

  // Floating Chat
  floatingChats: { id: string, title: string }[];
  addFloatingChat: (id: string, title: string) => void;
  removeFloatingChat: (id: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  universes: [],
  setUniverses: (universes) => set({ universes }),
  addUniverse: (u) => set((s) => ({ universes: [u, ...s.universes] })),
  updateUniverse: (id, data) =>
    set((s) => ({
      universes: s.universes.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),
  removeUniverse: (id) =>
    set((s) => ({ universes: s.universes.filter((u) => u.id !== id) })),

  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (c) => set((s) => ({ characters: [c, ...s.characters] })),
  updateCharacter: (id, data) =>
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeCharacter: (id) =>
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) })),

  pendingInvitationCount: 0,
  setPendingInvitationCount: (n) => set({ pendingInvitationCount: n }),

  floatingChats: [],
  addFloatingChat: (id, title) => 
    set((s) => {
      if (s.floatingChats.find(c => c.id === id)) return s; // already open
      const newChats = [...s.floatingChats, { id, title }];
      // Keep max 3 open
      if (newChats.length > 3) newChats.shift();
      return { floatingChats: newChats };
    }),
  removeFloatingChat: (id) =>
    set((s) => ({ floatingChats: s.floatingChats.filter(c => c.id !== id) })),
}));
