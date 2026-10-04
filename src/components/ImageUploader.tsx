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
    <form onSubmit={handleSubmit} className="space-y-3">
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

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Left: Upload area / preview */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between min-h-[140px]">
          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-slate-50/60 hover:bg-slate-50 flex-1 ${
                isDragging
                  ? 'border-[#004A87] bg-[#EEF4F9]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#004A87] shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-xs text-slate-800">
                  {t.screenshotUploadPrompt}
                </p>
                <p className="text-[10.5px] text-slate-400">{t.screenshotFormats}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon className="w-4 h-4 text-[#004A87] shrink-0" />
                  <span className="font-medium truncate text-xs text-slate-800">
                    {selectedFile?.name}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600"
                  title="Remove screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Screenshot Preview"
                  className="max-h-36 max-w-full object-contain rounded"
                />
              </div>

              <input
                type="text"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                disabled={isLoading}
                placeholder={
                  lang === 'hi'
                    ? 'वैकल्पिक: स्क्रीनशॉट से मुख्य टेक्स्ट यहाँ टाइप करें...'
                    : 'Optional: Extracted text or note from image...'
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Right: Action Button */}
        <button
          type="submit"
          disabled={isLoading || !selectedFile}
          className="md:w-56 flex md:flex-col items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base bg-[#004A87] hover:bg-[#003B6D] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all active:scale-[0.99] shrink-0 min-h-[54px] md:min-h-[140px]"
        >
          {isLoading ? (
            <span>{t.btnAnalyzing}</span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{lang === 'hi' ? 'इमेज जांचें' : 'Analyze for Scams'}</span>
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
