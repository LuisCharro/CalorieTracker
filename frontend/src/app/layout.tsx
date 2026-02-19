import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../core/auth';
import { MSWProvider } from './msw-provider';
import { NetworkStatusMonitor, OfflineQueueIndicator } from '../components/offline';
import { OfflineQueueProvider } from '../core/contexts/OfflineQueueContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CalorieTracker - Track Your Nutrition',
  description: 'Simple, privacy-focused calorie tracking for a healthier lifestyle.',
  keywords: ['calorie tracker', 'nutrition', 'diet', 'health', 'fitness'],
  authors: [{ name: 'CalorieTracker' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MSWProvider>
          <AuthProvider>
            <OfflineQueueProvider>
              <NetworkStatusMonitor />
              {children}
              <OfflineQueueIndicator />
            </OfflineQueueProvider>
          </AuthProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
