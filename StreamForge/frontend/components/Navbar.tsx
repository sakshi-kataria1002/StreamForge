'use client';

import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import { logout } from '../lib/store/authSlice';
import { getNotifications, markAllRead, Notification } from '../lib/api/notification.api';
import { useTheme } from '../lib/context/theme';
import { useSidebar } from '../lib/context/sidebar';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleSidebar } = useSidebar();
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user || !accessToken) return;
    getNotifications(accessToken)
      .then((d) => { setNotifications(d.notifications); setUnreadCount(d.unreadCount); })
      .catch(() => {});
  }, [user, accessToken]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifications = async () => {
    setNotifOpen((prev) => !prev);
    if (!notifOpen && unreadCount > 0 && accessToken) {
      await markAllRead(accessToken);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm shadow-gray-200/80 dark:shadow-black/20 border-gray-200 dark:border-slate-800'
        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          {user && (
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={toggleSidebar}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-400 transition-all duration-300 shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-300">
              StreamForge
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={openNotifications}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-black/40 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 dark:text-slate-500 text-sm">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n._id}
                            href={`/videos/${n.video?._id}`}
                            onClick={() => setNotifOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors ${n.read ? '' : 'bg-indigo-50/50 dark:bg-indigo-500/5'}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                              {n.actor?.name?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 dark:text-slate-300 leading-snug">
                                <span className="font-semibold text-gray-900 dark:text-white">{n.actor?.name}</span> uploaded{' '}
                                <span className="font-medium text-indigo-600 dark:text-indigo-300 truncate">{n.video?.title}</span>
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-slate-600 mt-0.5">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pl-1">
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/30">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300 hidden sm:block">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 hidden sm:block"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold px-4 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-600/30"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
