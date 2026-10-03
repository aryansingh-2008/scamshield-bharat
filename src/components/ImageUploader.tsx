'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface ImageUploaderProps {
  lang: 'en' | 'hi';
  onAnalyzeScreenshot: (file: File, contextText?: string) => void;
  isLoading: boolean;
}

export default function ImageUploader({
  lang,
  onAnalyzeScreenshot,
  isLoading,
}: ImageUploaderProps) {
  const t = TRANSLATIONS[lang];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contextText, setContextText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError(
        lang === 'hi'
          ? 'स्क्रीनशॉट 5MB से छोटा होना चाहिए।'
          : 'Screenshot must be smaller than 5MB.'
      );
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(
        lang === 'hi'
          ? 'केवल JPG, PNG और WebP इमेज समर्थित हैं।'
          : 'Only JPG, PNG, and WebP images are supported.'
      );
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setContextText('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError(
        lang === 'hi'
          ? 'कृपया पहले स्क्रीनशॉट अपलोड करें।'
          : 'Please select a screenshot first.'
      );
      return;
    }
    onAnalyzeScreenshot(selectedFile, contextText.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
        id="screenshot-input"
        disabled={isLoading}
      />

      {!previewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-md p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 bg-console-850/50 hover:bg-console-850 ${
            isDragging
              ? 'border-safety-brand-primary bg-safety-brand-subtle'
              : 'border-console-700 hover:border-console-600'
          }`}
        >
          <div className="w-10 h-10 rounded-md bg-white border border-console-700 flex items-center justify-center text-safety-brand-primary">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-xs sm:text-sm text-console-100">
              {t.screenshotUploadPrompt}
            </p>
            <p className="text-[11px] text-console-400 font-mono">{t.screenshotFormats}</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-md border border-console-700 bg-white p-3 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-console-300 pb-2 border-b border-console-700">
            <div className="flex items-center gap-2 truncate">
              <ImageIcon className="w-4 h-4 text-safety-brand-primary shrink-0" />
              <span className="font-medium truncate font-mono text-[11px] text-console-100">{selectedFile?.name}</span>
              <span className="text-console-400 font-mono text-[10px]">
                ({Math.round((selectedFile?.size || 0) / 1024)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="p-1 rounded hover:bg-console-850 text-console-400 hover:text-console-100"
              title="Remove screenshot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-60 overflow-hidden rounded border border-console-700 bg-console-850 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Screenshot Preview"
              className="max-h-56 max-w-full object-contain rounded"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label htmlFor="screenshot-context" className="block text-xs font-medium text-console-300">
              {lang === 'hi'
                ? 'वैकल्पिक: स्क्रीनशॉट का मुख्य संदेश या टेक्स्ट (यदि उपलब्ध हो):'
                : 'Optional: Extracted message text or notes from screenshot (if available):'}
            </label>
            <textarea
              id="screenshot-context"
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              disabled={isLoading}
              rows={2}
              placeholder={
                lang === 'hi'
                  ? 'यदि स्क्रीनशॉट में लिखा संदेश आप पढ़ पा रहे हैं, तो त्वरित जांच के लिए यहाँ पेस्ट कर सकते हैं...'
                  : 'If you can read key text from the image, paste or type it here for instant risk matching...'
              }
              className="w-full rounded-md border border-console-700 bg-white p-2.5 text-xs text-console-100 placeholder:text-console-500 focus:border-safety-brand-primary focus:outline-none focus:ring-1 focus:ring-safety-brand-primary font-sans"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-safety-high-bg border border-safety-high-border text-safety-high-text text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-safety-high-accent" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !selectedFile}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md font-semibold text-xs sm:text-sm bg-safety-brand-primary text-white hover:bg-safety-brand-secondary active:scale-[0.99] disabled:bg-[#D8DEE5] disabled:text-[#667085] disabled:cursor-not-allowed transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-safety-brand-primary"
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
    </form>
  );
}
