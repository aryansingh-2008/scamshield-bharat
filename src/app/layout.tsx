import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://scamshieldbharat.live'),
  title: {
    default: 'Scam Shield Bharat | Scam & Fraud Checker',
    template: '%s | Scam Shield Bharat',
  },
  description:
    'Check suspicious links, investment offers and payment scams with Scam Shield Bharat.',
  keywords: [
    'Scam Shield Bharat',
    'ScamShield Bharat',
    'ScamShield',
    'Scam Shield',
    'Scam Bharat',
    'ScamShield India',
    'Scam Shield India',
    'scamshieldbharat.live',
    'Scam Detection India',
    'Financial Scam Detection',
    'Phishing Link Checker',
    'Suspicious URL Checker',
    'SEBI Verification',
    'RBI Sachet',
    'Cyber Crime Prevention 1930',
  ],
  authors: [{ name: 'Scam Shield Bharat Security Team' }],
  creator: 'Scam Shield Bharat Initiative',
  publisher: 'Scam Shield Bharat',
  alternates: {
    canonical: 'https://scamshieldbharat.live',
  },
  openGraph: {
    title: 'Scam Shield Bharat | Scam & Fraud Checker',
    description:
      'Check suspicious links, investment offers and payment scams with Scam Shield Bharat.',
    url: 'https://scamshieldbharat.live',
    siteName: 'Scam Shield Bharat',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scam Shield Bharat | Scam & Fraud Checker',
    description:
      'Check suspicious links, investment offers and payment scams with Scam Shield Bharat.',
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
  verification: {
    google: 'y6y2vYlmEPSPMbWsZlbSXoTO5VUCT6295SxzkVtZsPA',
  },
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
      name: 'Scam Shield Bharat',
      alternateName: [
        'ScamShield Bharat',
        'ScamShield',
        'Scam Shield',
        'Scam Bharat',
        'ScamShield India',
        'Scam Shield India',
        'ScamShield Bharat Live',
      ],
      description:
        'India’s Evidence-First Financial Cyber Safety and Scam Protection Assistant for Citizens and Retail Investors.',
      inLanguage: ['en-IN', 'hi-IN'],
    },
    {
      '@type': 'Organization',
      '@id': 'https://scamshieldbharat.live/#organization',
      name: 'Scam Shield Bharat',
      alternateName: [
        'ScamShield Bharat',
        'ScamShield',
        'Scam Shield',
        'Scam Bharat',
        'ScamShield India',
        'Scam Shield India',
      ],
      url: 'https://scamshieldbharat.live',
      logo: 'https://scamshieldbharat.live/icon.svg',
      description:
        'Independent Civic Cybersecurity & Fraud Prevention Initiative dedicated to protecting Indian citizens and retail investors against cyber fraud, phishing links, and financial scams.',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      knowsAbout: [
        'Cyber Crime Detection',
        'Financial Fraud Prevention',
        'Phishing Link Checking',
        'Suspicious URL Analysis',
        'SEBI Advisory Verification',
        'RBI Sachet Verification',
        'Online Scam Detection India',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Scam Shield Bharat',
      alternateName: ['ScamShield Bharat', 'ScamShield', 'Scam Shield', 'ScamShield India'],
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
