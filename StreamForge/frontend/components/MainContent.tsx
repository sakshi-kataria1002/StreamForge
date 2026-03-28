'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

interface RootState {
  auth: { user: { id: string; name: string } | null };
}

export default function MainContent({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    // lg:ml-56 — only offset on desktop where the fixed sidebar is always visible
    <main className={`transition-all duration-300 ${mounted && user ? 'lg:ml-56' : ''}`}>
      {children}
    </main>
  );
}
