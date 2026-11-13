import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://scamshieldbharat.live'),
  title: {
    default: 'ScamShield Bharat | India’s Financial Scam & Cyber Fraud Detection Assistant',
    template: '%s | ScamShield Bharat',
  },
  description:
    'ScamShield Bharat (scamshieldbharat.live) is India’s evidence-first financial cyber safety assistant. Safely verify suspicious stock recommendations, Telegram investment channels, fake IPOs, and fraudulent payment APKs against official regulatory records.',
  keywords: [
    'ScamShield Bharat',
    'scam shield bharat',
    'scamshield bharat',
    'scam shield bharat live',
    'scamshieldbharat.live',
    'Scam Shield India',
    'Financial Scam Detection',
    'SEBI Verification',
    'RBI Sachet',
    'Investor Protection India',
    'Phishing Detector India',
    'Fraud Prevention India',
    'Cyber Crime Prevention 1930',
    'Telegram Scam Detector',
    'Fake Stock Advisory Detection',
  ],
  authors: [{ name: 'ScamShield Bharat Security Team' }],
  creator: 'ScamShield Bharat Initiative',
  publisher: 'ScamShield Bharat',
  alternates: {
    canonical: 'https://scamshieldbharat.live',
  },
  openGraph: {
    title: 'ScamShield Bharat | Evidence-First Financial Cyber Safety',
    description:
      'Verify suspicious financial messages, fraudulent stock recommendations, and fake investment apps against official SEBI and RBI records.',
    url: 'https://scamshieldbharat.live',
    siteName: 'ScamShield Bharat',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScamShield Bharat | Cyber Fraud Detection Assistant',
    description:
      'Evidence-first financial cyber safety assistant for Indian retail investors and citizens.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F7F8FA',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://scamshieldbharat.live/#website',
      url: 'https://scamshieldbharat.live',
      name: 'ScamShield Bharat',
      alternateName: ['scam shield bharat', 'ScamShield Bharat Live'],
      description:
        'India’s Evidence-First Financial Cyber Safety Assistant for Citizens and Retail Investors.',
      inLanguage: ['en-IN', 'hi-IN'],
    },
    {
      '@type': 'Organization',
      '@id': 'https://scamshieldbharat.live/#organization',
      name: 'ScamShield Bharat',
      url: 'https://scamshieldbharat.live',
      description: 'Independent Civic Cybersecurity & Fraud Prevention Initiative',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      knowsAbout: [
        'Cyber Crime Detection',
        'Financial Fraud Prevention',
        'SEBI Advisory Verification',
        'RBI Sachet Verification',
        'Phishing Detection',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'ScamShield Bharat',
      operatingSystem: 'All Web Browsers, Android, iOS, Windows, macOS',
      applicationCategory: 'SecurityApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-console-950 text-console-100 min-h-screen flex flex-col selection:bg-safety-brand-primary/15 selection:text-safety-brand-primary overflow-x-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
