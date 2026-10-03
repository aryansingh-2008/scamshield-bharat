import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScamShield Bharat | Evidence-First Financial Verification Assistant',
  description:
    'Evidence-first investor safety console that helps Indian investors safely evaluate suspicious financial messages, screenshots, and links against official SEBI and RBI records.',
  keywords: [
    'ScamShield Bharat',
    'Financial Scam Detection',
    'SEBI Verification',
    'RBI Sachet',
    'Investor Protection India',
    'Phishing Detector',
    'Fraud Prevention',
  ],
  authors: [{ name: 'ScamShield Bharat Engineering Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F7F8FA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-console-950 text-console-100 min-h-screen flex flex-col selection:bg-safety-brand-primary/15 selection:text-safety-brand-primary">
        {children}
      </body>
    </html>
  );
}
