'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const { data: session, status } = useSession();
  const [autoLogging, setAutoLogging] = useState(false);

  // Auto-login as admin if no session
  useEffect(() => {
    if (status === 'unauthenticated' && !autoLogging) {
      setAutoLogging(true);
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=admin@qrdomotik.com&password=Admin123!'
      }).then(() => {
        window.location.reload();
      });
    }
  }, [status, autoLogging]);

  if (status === 'loading' || (status === 'unauthenticated' && autoLogging)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <DashboardLayout />;
}
