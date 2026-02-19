'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      if (process.env.NEXT_PUBLIC_E2E_MOCK === 'true') {
        try {
          const { startMockWorker } = await import('../mocks/browser');
          await startMockWorker();
        } catch (e) {
          console.warn('Failed to start mock worker:', e);
        }
      }
      setReady(true);
    }
    init();
  }, []);

  if (!ready && process.env.NEXT_PUBLIC_E2E_MOCK === 'true') {
    return null;
  }

  return <>{children}</>;
}
