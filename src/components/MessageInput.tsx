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

  const MAX_CHARS = 5000;

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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Side-by-Side Flex Layout (Matching Reference Design) */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Left: Textarea Box */}
        <div className="flex-1 relative rounded-xl border border-slate-200 bg-white p-3.5 focus-within:border-[#004A87] focus-within:ring-1 focus-within:ring-[#004A87] transition-all flex flex-col justify-between min-h-[140px]">
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
            rows={4}
            placeholder={
              lang === 'hi'
                ? 'संदेश, ईमेल या सामग्री यहाँ पेस्ट करें...'
                : 'Paste your message, email or content here...'
            }
            disabled={isLoading}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-sans leading-relaxed resize-none flex-1"
          />

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={handlePasteSample}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-[#004A87] hover:text-[#003B6D] font-semibold transition-colors text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नमूना लोड करें' : 'Load Sample'}</span>
            </button>

            <div className="flex items-center gap-3">
              {content.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={() => setContent('')}
                  className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs"
                  title={t.btnClear}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.btnClear}</span>
                </button>
              )}
              <span className="font-mono text-[11px] text-slate-400">
                {content.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Solid Navy Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="md:w-56 flex md:flex-col items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base bg-[#004A87] hover:bg-[#003B6D] text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] shrink-0 min-h-[54px] md:min-h-[140px]"
        >
          {isLoading ? (
            <span>{t.btnAnalyzing}</span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{lang === 'hi' ? 'धोखाधड़ी जांचें' : 'Analyze for Scams'}</span>
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
