'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store, AppDispatch } from '../lib/store/store';
import { setCredentials } from '../lib/store/authSlice';
import { ThemeProvider } from '../lib/context/theme';
import { SidebarProvider } from '../lib/context/sidebar';
import { ToastProvider } from '../lib/context/toast';

function AuthRehydrator() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sf_auth');
      if (!raw) return;
      const { user, accessToken } = JSON.parse(raw);
      if (user && accessToken) dispatch(setCredentials({ user, accessToken }));
    } catch {}
  }, [dispatch]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthRehydrator />
      <ThemeProvider>
        <SidebarProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  );
}
