'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

interface NotificationPrefs {
  emailOnNewSubscriber: boolean;
  emailOnNewComment: boolean;
  emailOnCommentReply: boolean;
}

const STORAGE_KEY = 'sf_notification_prefs';
const defaultPrefs: NotificationPrefs = {
  emailOnNewSubscriber: true,
  emailOnNewComment: true,
  emailOnCommentReply: true,
};

function loadPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPrefs, ...JSON.parse(stored) };
  } catch {}
  return { ...defaultPrefs };
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
          {label}
        </label>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'
        }`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setMounted(true); setPrefs(loadPrefs()); }, []);
  useEffect(() => { if (mounted && !user) router.replace('/login'); }, [user, router, mounted]);

  const setField = (field: keyof NotificationPrefs) => (value: boolean) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  };

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Choose when StreamForge sends you email notifications.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Email Notifications</h2>
            </div>
          </div>
          <div className="px-6 divide-y divide-gray-100 dark:divide-slate-800">
            <ToggleRow id="toggle-new-subscriber" label="New subscriber" description="Get an email when someone subscribes to your channel." checked={prefs.emailOnNewSubscriber} onChange={setField('emailOnNewSubscriber')} />
            <ToggleRow id="toggle-new-comment" label="New comment on your video" description="Get an email when someone comments on one of your videos." checked={prefs.emailOnNewComment} onChange={setField('emailOnNewComment')} />
            <ToggleRow id="toggle-comment-reply" label="Replies to your comments" description="Get an email when someone replies to a comment you left." checked={prefs.emailOnCommentReply} onChange={setField('emailOnCommentReply')} />
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 px-5 py-4 text-sm text-indigo-700 dark:text-indigo-300">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <span>Emails are sent to <strong className="font-semibold">{user.name}</strong>'s registered address. Preferences are stored locally on this device.</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Saved
            </span>
          )}
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all duration-150 focus:outline-none">
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
