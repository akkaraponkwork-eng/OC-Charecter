'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/store/useLocale';
import { MessageCircle, Trash2 } from 'lucide-react';

interface Message {
  id: string; senderId: string; senderName: string;
  senderAvatar: string; content: string; createdAt: string;
}

interface Props {
  chatId: string;
  title: string;
  onClose?: () => void;
  asPanel?: boolean; // slide-in panel vs full page
}

export default function ChatBox({ chatId, title, onClose, asPanel }: Props) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const uid = (session?.user as any)?.uid;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?chatId=${chatId}`);
    if (res.ok) { 
      const data = await res.json(); 
      setMessages(data); 
      // Mark as read immediately when messages are loaded
      localStorage.setItem('lastRead_' + chatId, new Date().toISOString());
      localStorage.setItem('lastSeenMsg_' + chatId, new Date().toISOString());
    }
  };

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 20000);
    return () => clearInterval(intervalRef.current);
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, content: input.trim() }),
    });
    setInput('');
    setSending(false);
    fetchMessages();
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm(t('common.confirmDelete') || 'Delete this message?')) return;
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const containerStyle = asPanel ? {
    position: 'fixed' as const, right: 0, top: 60, bottom: 0,
    width: 360, background: 'var(--bg-elevated)', borderLeft: '1px solid var(--glass-border)',
    display: 'flex', flexDirection: 'column' as const, zIndex: 30,
  } : {
    display: 'flex', flexDirection: 'column' as const, height: '100%',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={16} /> {title}
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <p suppressHydrationWarning style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
            {t('chat.noMessages')}
          </p>
        )}
        {messages.map((msg) => {
          const isSelf = msg.senderId === uid;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isSelf ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-end' }}>
              {!isSelf && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.senderAvatar ? `url(${msg.senderAvatar}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'white',
                }}>
                  {!msg.senderAvatar && msg.senderName[0].toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                {!isSelf && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{msg.senderName}</div>}
                <div className={isSelf ? 'bubble-self' : 'bubble-other'}>{msg.content}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '0.2rem', display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                  {isSelf && (
                    <button 
                      onClick={() => deleteMessage(msg.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      title="Unsend message"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
        <input
          className="input"
          style={{ flex: 1, padding: '0.5rem 0.875rem', fontSize: '1rem' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.typeMessage')}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
        />
        <button suppressHydrationWarning className="btn-primary" type="submit" disabled={sending || !input.trim()}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          {t('chat.send')}
        </button>
      </form>
    </div>
  );
}
