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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifications = async () => {
    setNotifOpen((p) => !p);
    setUserMenuOpen(false);
    if (!notifOpen && unreadCount > 0 && accessToken) {
      await markAllRead(accessToken);
      setUnreadCount(0);
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/75 dark:bg-slate-950/80 backdrop-blur-2xl'
        : 'bg-white dark:bg-slate-950'
    }`}>
      {/* Gradient accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-500/30 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between">

        {/* ── Left: Logo ── */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-3 group select-none">
            {/* Icon with glow ring */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/50 group-hover:scale-[1.05] transition-all duration-200">
                <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="hidden sm:block leading-none">
              <span className="font-extrabold text-[17px] tracking-tight text-gray-900 dark:text-white">Stream</span>
              <span className="font-extrabold text-[17px] tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Forge</span>
            </div>
          </Link>

          {/* Mobile hamburger */}
          {user && (
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={toggleSidebar}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-1">

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-200 group"
          >
            <span className="absolute inset-0 rounded-xl bg-indigo-500/0 group-hover:bg-indigo-500/5 dark:group-hover:bg-indigo-500/10 transition-colors" />
            {theme === 'dark' ? (
              <svg className="w-[17px] h-[17px] relative" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-[17px] h-[17px] relative" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              {/* Subtle separator */}
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700/80 mx-1.5" />

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={openNotifications}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-[9px] w-[9px]">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-[9px] w-[9px] bg-red-500 ring-[1.5px] ring-white dark:ring-slate-950" />
                    </span>
                  )}
                </button>

                {/* Notif dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-[340px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/60 z-50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Notifications</p>
                        {unreadCount > 0 && (
                          <p className="text-xs text-indigo-500 mt-0.5">{unreadCount} unread</p>
                        )}
                      </div>
                      {unreadCount === 0 && notifications.length > 0 && (
                        <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                          All read
                        </span>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center px-6">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">You're all caught up</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">New uploads from your subscriptions will show here</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n._id}
                            href={`/videos/${n.video?._id}`}
                            onClick={() => setNotifOpen(false)}
                            className={`flex items-start gap-3.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800/40 last:border-0 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/[0.05]' : ''}`}
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm shadow-indigo-500/20">
                              {n.actor?.name?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                                <span className="font-semibold text-gray-900 dark:text-white">{n.actor?.name}</span>{' '}
                                uploaded a new video —{' '}
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium line-clamp-1">{n.video?.title}</span>
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar + dropdown */}
              <div className="relative ml-0.5" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false); }}
                  aria-label="User menu"
                  className="flex items-center gap-2.5 h-9 pl-2 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors group"
                >
                  {/* Avatar with ring */}
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/30">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-[2px] ring-white dark:ring-slate-950" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 hidden sm:block max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 dark:text-slate-500 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-60 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/60 z-50 overflow-hidden">
                    {/* Gradient header */}
                    <div className="relative px-5 py-4 overflow-hidden border-b border-gray-100 dark:border-slate-800">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent dark:from-indigo-500/15 dark:via-violet-500/10 dark:to-transparent" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-indigo-500/30 shrink-0">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      {[
                        {
                          href: '/profile', label: 'My Profile',
                          desc: 'View your public page',
                          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
                        },
                        {
                          href: '/dashboard', label: 'Dashboard',
                          desc: 'Manage your videos',
                          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />,
                        },
                        {
                          href: '/history', label: 'Watch History',
                          desc: 'Your recent watches',
                          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
                        },
                        {
                          href: '/saved', label: 'Saved Videos',
                          desc: 'Your saved library',
                          icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />,
                        },
                      ].map(({ href, label, desc, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover/item:bg-indigo-50 dark:group-hover/item:bg-indigo-500/10 flex items-center justify-center text-gray-500 dark:text-slate-400 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors shrink-0">
                            <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              {icon}
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-slate-200 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">{label}</p>
                            <p className="text-[11px] text-gray-400 dark:text-slate-600">{desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-gray-100 dark:border-slate-800 p-2">
                      <button
                        type="button"
                        onClick={() => { dispatch(logout()); setUserMenuOpen(false); }}
                        className="flex items-center gap-3.5 w-full px-4 py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group/signout"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-400 group-hover/signout:bg-red-100 dark:group-hover/signout:bg-red-500/20 transition-colors shrink-0">
                          <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-500 dark:text-red-400">Sign out</p>
                          <p className="text-[11px] text-red-400/60 dark:text-red-400/40">See you next time</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700/80 mx-1.5" />
              <Link
                href="/login"
                className="h-9 px-4 flex items-center text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="h-9 px-4 flex items-center gap-1.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-[0.97]"
              >
                Get started
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
