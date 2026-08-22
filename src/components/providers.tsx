'use client';

import { SessionProvider } from 'next-auth/react';

const HARDCODED_SESSION = {
  user: {
    id: 'cmt24hwkd0000ucghhydck4l7',
    email: 'admin@qrdomotik.com',
    name: 'Admin QR Domotik',
    role: 'superadmin',
    image: null,
  },
  expires: '2099-12-31T23:59:59.000Z',
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider session={HARDCODED_SESSION}>{children}</SessionProvider>;
}
