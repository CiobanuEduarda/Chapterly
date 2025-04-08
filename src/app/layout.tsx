"use client"
import { ToastProvider } from '../lib/toastContext';
import { BookProvider } from '../lib/bookContext';
import { ChartProvider } from '../lib/chartContext';
import { NetworkProvider } from '../lib/networkContext';
import { SyncProvider } from '../lib/syncService';
import { NetworkStatus } from '../components/NetworkStatus';
import '../styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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