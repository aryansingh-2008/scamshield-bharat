'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioReaderProps {
  textToRead: string;
  lang: 'en' | 'hi';
}

export default function AudioReader({ textToRead, lang }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const handleTogglePlay = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // slightly slower for high clarity

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-console-700 bg-white text-xs font-semibold text-console-200 hover:text-console-100 hover:bg-console-850 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-safety-brand-primary"
      title={lang === 'hi' ? 'आवाज़ में सुनें' : 'Read aloud explanation'}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>{lang === 'hi' ? '⏹️ बंद करें' : 'Stop Audio'}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-safety-brand-primary" />
          <span>{lang === 'hi' ? '🔊 सुनें (Audio)' : 'Listen Briefing'}</span>
        </>
      )}
    </button>
  );
}
