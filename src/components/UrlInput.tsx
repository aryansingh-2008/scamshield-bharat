'use client';

import React, { useState } from 'react';
import { Link2, ArrowRight, ShieldAlert, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';
import { validateAndParseUrl } from '@/lib/url-security';

interface UrlInputProps {
  lang: 'en' | 'hi';
  onAnalyzeUrl: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ lang, onAnalyzeUrl, isLoading }: UrlInputProps) {
  const t = TRANSLATIONS[lang];
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePasteSample = () => {
    setUrl('https://kyc-update-portal.xyz/verify-trading-account');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError(
        lang === 'hi'
          ? 'कृपया जांच के लिए एक वेब लिंक दर्ज करें।'
          : 'Please enter a web link to verify.'
      );
      return;
    }

    const check = validateAndParseUrl(url.trim());
    if (!check.isValid) {
      setError(check.error || 'Invalid URL address.');
      return;
    }

    setError(null);
    onAnalyzeUrl(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="url-input" className="sr-only">
          {t.tabLink}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 text-console-400">
            <Link2 className="w-4 h-4" />
          </div>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t.placeholderUrl}
            disabled={isLoading}
            className="w-full rounded-md border border-console-700 bg-white pl-10 pr-4 py-3 text-xs sm:text-sm text-console-100 placeholder:text-console-500 focus:border-safety-brand-primary focus:outline-none focus:ring-1 focus:ring-safety-brand-primary transition-all font-mono"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-console-400 px-1">
          <button
            type="button"
            onClick={handlePasteSample}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-safety-brand-primary hover:text-safety-brand-secondary font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.btnPasteSample}</span>
          </button>
        </div>
      </div>

      <div className="p-3 rounded-md bg-console-850 border border-console-700 text-[11px] text-console-400 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-safety-warning-accent shrink-0 mt-0.5" />
        <span className="font-sans leading-relaxed">
          {lang === 'hi'
            ? 'सुरक्षा प्रतिबंध: हम सर्वर पर अनजान कोड को कभी निष्पादित नहीं करते हैं। केवल सुरक्षित संरचनात्मक और डोमेन प्रतिष्ठा विश्लेषण किया जाता है।'
            : 'Security Boundary: ScamShield never executes untrusted remote JavaScript. Only structural domain heuristics and phishing registries are analyzed.'}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-safety-high-bg border border-safety-high-border text-safety-high-text text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-safety-high-accent" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-md font-semibold text-xs sm:text-sm bg-safety-brand-primary text-white hover:bg-safety-brand-secondary active:scale-[0.99] disabled:bg-[#D8DEE5] disabled:text-[#667085] disabled:cursor-not-allowed transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-safety-brand-primary"
        >
          {isLoading ? (
            <span>{t.btnAnalyzing}</span>
          ) : (
            <>
              <span>{t.btnAnalyze}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {url.length > 0 && !isLoading && (
          <button
            type="button"
            onClick={() => setUrl('')}
            className="py-2.5 px-4 sm:p-3 rounded-md border border-console-700 bg-white text-console-400 hover:text-console-100 hover:bg-console-850 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
            title={t.btnClear}
            aria-label={t.btnClear}
          >
            <Trash2 className="w-4 h-4" />
            <span className="sm:hidden">{t.btnClear}</span>
          </button>
        )}
      </div>
    </form>
  );
}
