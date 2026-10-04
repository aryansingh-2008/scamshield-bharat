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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Side-by-Side Flex Layout */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Left: URL Input Box */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3.5 focus-within:border-[#004A87] focus-within:ring-1 focus-within:ring-[#004A87] transition-all flex flex-col justify-between min-h-[140px]">
          <div className="space-y-2">
            <label htmlFor="url-input" className="sr-only">
              {t.tabLink}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400">
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
                placeholder={
                  lang === 'hi'
                    ? 'जांच के लिए वेबसाइट लिंक दर्ज करें (उदा. https://...)'
                    : 'https://suspicious-broker-link.com/invest'
                }
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="font-sans leading-snug">
                {lang === 'hi'
                  ? 'सुरक्षा: हम कभी भी रिमोट कोड निष्पादित नहीं करते हैं। केवल सुरक्षित डोमेन प्रतिष्ठा व विनियामक सूची जांच की जाती है।'
                  : 'Security: ScamShield never executes untrusted remote JavaScript. Only structural domain heuristics and phishing registries are analyzed.'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={handlePasteSample}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-[#004A87] hover:text-[#003B6D] font-semibold transition-colors text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नमूना URL लोड करें' : 'Load Sample URL'}</span>
            </button>

            {url.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs"
                title={t.btnClear}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.btnClear}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Action Button */}
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="md:w-56 flex md:flex-col items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base bg-[#004A87] hover:bg-[#003B6D] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all active:scale-[0.99] shrink-0 min-h-[54px] md:min-h-[140px]"
        >
          {isLoading ? (
            <span>{t.btnAnalyzing}</span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{lang === 'hi' ? 'लिंक जांचें' : 'Analyze for Scams'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
