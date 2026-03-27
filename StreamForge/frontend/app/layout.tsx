import type { Metadata } from 'next';
import './globals.css';
import Providers from '../components/Providers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';

export const metadata: Metadata = {
  title: 'StreamForge',
  description: 'Upload, watch, and share videos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors duration-200">
        <Providers>
          <Navbar />
          <Sidebar />
          <MainContent>{children}</MainContent>
        </Providers>
      </body>
    </html>
  );
}
