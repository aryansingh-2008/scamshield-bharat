'use client';

import React from 'react';
import { ShieldCheck, PhoneCall, ExternalLink, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';
import { OFFICIAL_SOURCES, CYBERCRIME_HELPLINE } from '@/lib/official-sources';

interface FooterProps {
  lang: 'en' | 'hi';
}

export default function Footer({ lang }: FooterProps) {
  const t = TRANSLATIONS[lang];

  return (
    <footer className="w-full border-t border-console-700 bg-white mt-16 text-xs text-console-400">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Top Tier: Official Portals & Helplines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8 border-b border-console-700/60">
          <div className="space-y-2 md:col-span-1">
            <div className="flex items-center gap-2 text-console-100 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-safety-brand-primary" />
              <span>{t.brandName}</span>
            </div>
            <p className="text-xs text-console-400 leading-relaxed">
              {t.brandTagline}
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-console-100 text-xs uppercase tracking-wider font-mono">
              Cyber Fraud Reporting
            </h5>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${CYBERCRIME_HELPLINE.number}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-sm"
                title="Call National Financial Cyber Fraud Helpline 1930"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 1930 (MHA)</span>
              </a>
            </div>
            <p className="text-[11px] text-console-400 pt-1">
              <a
                href={OFFICIAL_SOURCES.CYBERCRIME_PORTAL.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-safety-brand-primary hover:underline"
              >
                <span>cybercrime.gov.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-console-100 text-xs uppercase tracking-wider font-mono">
              SEBI Registries & Grievance
            </h5>
            <ul className="space-y-1.5">
              <li>
                <a
                  href={OFFICIAL_SOURCES.SEBI_INTERMEDIARIES.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-safety-brand-primary hover:underline"
                >
                  <span>SEBI Recognised Intermediaries</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_SOURCES.SEBI_INVESTOR_SPOT_SCAM.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-safety-brand-primary hover:underline"
                >
                  <span>SEBI Spot a Scam Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_SOURCES.SEBI_SCORES.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-safety-brand-primary hover:underline"
                >
                  <span>SEBI SCORES (Grievance Redressal)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-console-100 text-xs uppercase tracking-wider font-mono">
              RBI & Cybersecurity
            </h5>
            <ul className="space-y-1.5">
              <li>
                <a
                  href={OFFICIAL_SOURCES.RBI_SACHET.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-safety-brand-primary hover:underline"
                >
                  <span>RBI Sachet Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_SOURCES.CERT_IN.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-safety-brand-primary hover:underline"
                >
                  <span>CERT-In Advisories</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_SOURCES.SANGYAN_WEBSITE.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-console-400 hover:text-console-100"
                >
                  <span>SANGYAN IIT BHU Hackathon</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-950/90 leading-relaxed">
            <strong className="text-amber-950 font-semibold">
              {lang === 'hi' ? 'महत्वपूर्ण अस्वीकरण: ' : 'Important Notice: '}
            </strong>
            {t.disclaimerText}
          </p>
        </div>

        {/* Copyright & Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-console-400">
          <p>{t.footerCopyright}</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-medium">✓ Evidence-First Architecture</span>
            <span className="text-safety-brand-primary font-medium">✓ Calm Safety Console</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
