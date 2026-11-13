import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Citizen Login & Portal',
  description:
    'Sign in or register for ScamShield Bharat to access priority scam investigation tools and save incident verification records.',
  alternates: {
    canonical: 'https://scamshieldbharat.live/login',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
