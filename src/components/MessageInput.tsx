'use client';

import React, { useState } from 'react';
import { ArrowRight, Trash2, FileText, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface MessageInputProps {
  lang: 'en' | 'hi';
  onAnalyze: (content: string) => void;
  isLoading: boolean;
}

export default function MessageInput({ lang, onAnalyze, isLoading }: MessageInputProps) {
  const t = TRANSLATIONS[lang];
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const MAX_CHARS = 3000;

  const handlePasteSample = () => {
    const sample = `SEBI approved investment opportunity.
Guaranteed 30% monthly return.
Only 20 seats left.
Join our Telegram group now: https://t.me/sebi_vip_wealth
Deposit ₹50,000 today to start trading.`;
    setContent(sample);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setError(
        lang === 'hi'
          ? 'कृपया कम से कम 5 अक्षरों का संदेश दर्ज करें।'
          : 'Please enter at least 5 characters to analyze.'
      );
      return;
    }
    setError(null);
    onAnalyze(content.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative space-y-1.5">
        <label htmlFor="message-text" className="sr-only">
          {t.tabMessage}
        </label>
        <textarea
          id="message-text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError(null);
          }}
          maxLength={MAX_CHARS}
          rows={6}
          placeholder={t.placeholderMessage}
          disabled={isLoading}
          className="w-full rounded-md border border-console-700 bg-white p-4 text-xs sm:text-sm text-console-100 placeholder:text-console-500 focus:border-safety-brand-primary focus:outline-none focus:ring-1 focus:ring-safety-brand-primary transition-all font-sans leading-relaxed resize-y min-h-[140px]"
        />

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

          <span className="font-mono text-[11px] text-console-400">
            {content.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-safety-high-bg border border-safety-high-border text-safety-high-text text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-safety-high-accent" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-md font-semibold text-xs sm:text-sm bg-safety-brand-primary text-white hover:bg-safety-brand-secondary active:scale-[0.99] disabled:bg-[#D8DEE5] disabled:text-[#667085] disabled:cursor-not-allowed transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-safety-brand-primary"
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

        {content.length > 0 && !isLoading && (
          <button
            type="button"
            onClick={() => setContent('')}
            className="p-3 rounded-md border border-console-700 bg-white text-console-400 hover:text-console-100 hover:bg-console-850 transition-colors"
            title={t.btnClear}
            aria-label={t.btnClear}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
