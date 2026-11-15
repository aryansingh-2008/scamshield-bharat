import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: {
    absolute: 'About Scam Shield Bharat | Our Mission',
  },
  description:
    'Learn about Scam Shield Bharat and our mission to help Indians identify online scams and fraud risks.',
  alternates: {
    canonical: 'https://scamshieldbharat.live/about',
  },
  openGraph: {
    title: 'About Scam Shield Bharat | Our Mission',
    description:
      'Learn about Scam Shield Bharat and our mission to help Indians identify online scams and fraud risks.',
    url: 'https://scamshieldbharat.live/about',
    siteName: 'Scam Shield Bharat',
    locale: 'en_IN',
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
