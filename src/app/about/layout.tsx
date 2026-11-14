import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'About Scam Shield Bharat | Mission, Identity & Scam Protection',
  description:
    'Learn about Scam Shield Bharat (also known as ScamShield Bharat / ScamShield). Discover our civic mission, scam detection technology, regulatory grounding (SEBI/RBI), and commitment to protecting Indian citizens against cyber fraud.',
  alternates: {
    canonical: 'https://scamshieldbharat.live/about',
  },
  openGraph: {
    title: 'About Scam Shield Bharat | Civic Cyber Safety & Scam Protection',
    description:
      'Learn how Scam Shield Bharat helps retail investors and citizens identify fraudulent stock recommendations, Telegram investment scams, and phishing URLs.',
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
