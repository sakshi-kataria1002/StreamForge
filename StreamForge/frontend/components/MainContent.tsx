'use client';

import { useSelector } from 'react-redux';

interface RootState {
  auth: { user: { id: string; name: string } | null };
}

export default function MainContent({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  return (
    // lg:ml-56 — only offset on desktop where the fixed sidebar is always visible
    <main className={`transition-all duration-300 ${user ? 'lg:ml-56' : ''}`}>
      {children}
    </main>
  );
}
