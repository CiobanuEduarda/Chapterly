"use client"
import { ToastProvider } from '../lib/toastContext';
import { BookProvider } from '../lib/bookContext';
import { ChartProvider } from '../lib/chartContext';
import { NetworkProvider } from '../lib/networkContext';
import { SyncProvider } from '../lib/syncService';
import { NetworkStatus } from '../components/NetworkStatus';
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('userRole') === 'ADMIN');
    }
  }, []);

  return (
    <html lang="en">
      <body className="overflow-x-hidden">
        <ToastProvider>
          <NetworkProvider>
            <SyncProvider>
              <BookProvider>
                <ChartProvider>
                  <div className="flex flex-col min-h-screen w-full">
                    <header className="sticky top-0 z-50 w-full">
                      <NetworkStatus />
                    </header>
                    <nav className="p-4 bg-[#52796F] flex gap-1 items-center">
                      <Link href="/bookshelf" className="font-bold text-lg ">Chapterly</Link>
                      {/* Other nav links here */}
                      {hasMounted && isAdmin && (
                        <Link href="/admin/monitored-users" className="ml-auto bg-[#C76E77] text-white px-4 py-2 rounded hover:bg-[#C76E77]">Admin Dashboard</Link>
                      )}
                    </nav>
                    <main className="flex-1 w-full">
                      {children}
                    </main>
                  </div>
                </ChartProvider>
              </BookProvider>
            </SyncProvider>
          </NetworkProvider>
        </ToastProvider>
      </body>
    </html>
  );
}