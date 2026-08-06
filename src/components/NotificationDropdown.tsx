'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark as read when opening
      const unread = notifications.some(n => !n.read);
      if (unread) {
        await fetch('/api/notifications', { method: 'PUT' });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        style={{ 
          background: 'var(--glass)', 
          border: '1px solid var(--glass-border)', 
          color: 'var(--text-main)', 
          width: 38, height: 38, borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: -2, right: -2, 
            background: 'var(--danger)', color: 'white', 
            fontSize: '0.65rem', fontWeight: 'bold', 
            minWidth: 16, height: 16, borderRadius: 8, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
          width: 320, background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Notifications</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <Link key={n.id} href={n.link} onClick={() => setIsOpen(false)} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{
                    padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.1)',
                    transition: 'background 0.2s'
                  }} className="hover:bg-glass">
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.content}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
