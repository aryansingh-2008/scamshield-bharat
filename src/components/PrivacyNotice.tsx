'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface PrivacyNoticeProps {
  lang: 'en' | 'hi';
}

export default function PrivacyNotice({ lang }: PrivacyNoticeProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="w-full rounded-lg border border-[#BBF7D0]/60 bg-[#F0FDF4]/50 px-3.5 py-2.5 text-xs text-console-300 flex items-center gap-2.5">
      <Shield className="w-4 h-4 text-[#087A5B] shrink-0" />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-relaxed text-xs">
        <span className="font-semibold text-console-100 font-sans">
          {t.privacyNoticeTitle}
        </span>
        <span className="text-console-400 hidden sm:inline">|</span>
        <span className="text-console-400 font-sans">
          {t.privacyNoticeBody}
        </span>
      </div>
    </div>
  );
}
