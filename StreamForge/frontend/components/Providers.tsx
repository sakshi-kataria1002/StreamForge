'use client';

import { Provider } from 'react-redux';
import { store } from '../lib/store/store';
import { ThemeProvider } from '../lib/context/theme';
import { SidebarProvider } from '../lib/context/sidebar';
import { ToastProvider } from '../lib/context/toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
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
