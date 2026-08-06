'use client';
import { useStore } from '@/store/useStore';
import ChatBox from './ChatBox';

export default function FloatingChatWidget() {
  const { floatingChats, removeFloatingChat } = useStore();

  if (floatingChats.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: '2rem',
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-end',
      zIndex: 100, // Make sure it sits above most things
      pointerEvents: 'none', // Allow clicking through the container
    }}>
      {floatingChats.map((chat) => (
        <div key={chat.id} style={{
          width: 340,
          height: 480,
          pointerEvents: 'auto', // Enable clicks inside the chat
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--glass-border)',
          borderBottom: 'none'
        }}>
          <ChatBox
            chatId={chat.id}
            title={chat.title}
            onClose={() => removeFloatingChat(chat.id)}
          />
        </div>
      ))}
    </div>
  );
}
