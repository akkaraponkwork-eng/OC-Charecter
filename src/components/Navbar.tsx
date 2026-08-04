'use client';
import { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/store/useLocale';
import { FolderOpen, MessageCircle, Mail, Shield, User, LogOut, Sparkles, Menu, X, Compass } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const { t, locale, toggleLocale } = useLocale();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const user = session?.user as any;

  useEffect(() => {
    setMounted(true);
  }, []);

  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [popup, setPopup] = useState<{title: string, message: string} | null>(null);
  const popupTimeout = useRef<NodeJS.Timeout>();
  const isFirstInvLoad = useRef(true);

  useEffect(() => {
    if (!session?.user?.email) return;

    const checkNotifications = async () => {
      try {
        // Invitations
        const invRes = await fetch('/api/invitations');
        const invData = await invRes.json();
        if (Array.isArray(invData)) {
          setPendingCount(prev => {
            if (!isFirstInvLoad.current && invData.length > prev) {
              setPopup({ title: 'New Invitation', message: 'You have a new universe invitation!' });
              if (popupTimeout.current) clearTimeout(popupTimeout.current);
              popupTimeout.current = setTimeout(() => setPopup(null), 5000);
            }
            isFirstInvLoad.current = false;
            return invData.length;
          });
        }

        // Chats
        const chatRes = await fetch('/api/chats');
        const chats = await chatRes.json();
        if (Array.isArray(chats)) {
          let unread = 0;
          chats.forEach(chat => {
            if (chat.latestMessage) {
              const lastRead = localStorage.getItem('lastRead_' + chat.id);
              if (!lastRead || new Date(chat.latestMessage.createdAt) > new Date(lastRead)) {
                unread++;
                const lastSeen = localStorage.getItem('lastSeenMsg_' + chat.id);
                const isSuperFresh = Date.now() - new Date(chat.latestMessage.createdAt).getTime() < 60000;
                if ((!lastSeen && isSuperFresh) || (lastSeen && new Date(chat.latestMessage.createdAt) > new Date(lastSeen))) {
                  localStorage.setItem('lastSeenMsg_' + chat.id, chat.latestMessage.createdAt);
                  setPopup({ title: 'New Message', message: `${chat.latestMessage.senderName}: ${chat.latestMessage.content}` });
                  if (popupTimeout.current) clearTimeout(popupTimeout.current);
                  popupTimeout.current = setTimeout(() => setPopup(null), 5000);
                }
              }
            }
          });
          setUnreadChatsCount(unread);
        }
      } catch (e) {}
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [session?.user?.email]);

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: <FolderOpen size={16} /> },
    { href: '/characters', label: 'Characters', icon: <User size={16} /> },
    { 
      href: '/messages', label: t('nav.messages'), icon: <MessageCircle size={16} />,
      badge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
    },
    {
      href: '/invitations', label: t('nav.invitations'), icon: <Mail size={16} />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    ...(user?.role?.toLowerCase() === 'admin' ? [{ href: '/admin', label: t('nav.admin'), icon: <Shield size={16} /> }] : []),
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem',
        height: 60, display: 'flex', alignItems: 'center', gap: '2rem',
      }}>
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileNavOpen(!mobileNavOpen)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'none', alignItems: 'center' }}
        >
          {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}><Sparkles size={18} /></span>
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }} className="gradient-text">OC Creator</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }} className="desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: pathname === link.href ? 600 : 400,
                color: pathname === link.href ? 'var(--text-main)' : 'var(--text-muted)',
                background: pathname === link.href ? 'var(--glass)' : 'transparent',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <span>{link.icon}</span>
              <span suppressHydrationWarning>{link.label}</span>
              {link.badge && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'var(--primary)', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>{link.badge}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Right: locale + profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {mounted && (
            <button
              onClick={toggleLocale}
              style={{
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)', height: 36, padding: '0 0.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '99px', cursor: 'pointer', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: 0.5,
              }}
            >{locale === 'en' ? 'EN' : 'TH'}</button>
          )}

          {/* Avatar dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                borderRadius: '99px', padding: '0.25rem 0.75rem 0.25rem 0.25rem',
                cursor: 'pointer', color: 'var(--text-main)',
              }}
            >
              {user?.avatarUrl || user?.image ? (
                <img src={user.avatarUrl || user.image} alt="avatar" className="avatar" style={{ width: 28, height: 28 }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: 'white',
                }}>
                  {(user?.name || user?.username || '?')[0].toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.username}
              </span>
              {user?.role?.toLowerCase() === 'admin' && <span className="badge badge-admin" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>admin</span>}
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)', minWidth: 160, overflow: 'hidden',
                  boxShadow: 'var(--shadow)', zIndex: 50,
                }}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <Link href="/profile/me" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', fontSize: '0.875rem', color: 'var(--text-main)', textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)}>
                  <User size={16} /> <span suppressHydrationWarning>{t('nav.profile')}</span>
                </Link>
                {user?.role?.toLowerCase() === 'admin' && (
                  <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', fontSize: '0.875rem', color: 'var(--primary-light)', textDecoration: 'none' }}
                    onClick={() => setMenuOpen(false)}>
                    <Shield size={16} /> <span suppressHydrationWarning>{t('nav.admin')}</span>
                  </Link>
                )}
                <div className="divider" style={{ margin: '0.25rem 0' }} />
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left',
                    padding: '0.7rem 1rem', fontSize: '0.875rem',
                    color: '#f87171', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                ><LogOut size={16} /> <span suppressHydrationWarning>{t('nav.logout')}</span></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, padding: '1rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--glass-border)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} className="mobile-nav">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.9rem',
                  fontWeight: pathname === link.href ? 600 : 400,
                  color: pathname === link.href ? 'var(--text-main)' : 'var(--text-muted)',
                  background: pathname === link.href ? 'var(--glass)' : 'transparent',
                }}
              >
                <span>{link.icon}</span>
                <span suppressHydrationWarning>{link.label}</span>
                {link.badge && (
                  <span style={{ marginLeft: 'auto', background: 'var(--primary)', color: 'white', borderRadius: '99px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    {link.badge} new
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Global Popup */}
      {popup && (
        <div className="toast" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }} onClick={() => setPopup(null)}>
          <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.85rem' }}>{popup.title}</span>
          <span style={{ fontSize: '0.9rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{popup.message}</span>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
