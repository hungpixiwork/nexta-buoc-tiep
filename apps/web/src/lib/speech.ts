import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser speech-to-text (Web Speech API). Audio is processed by the browser and
 * never stored by NEXTA — only the transcript the Navigator keeps.
 */
export function useSpeechToText(lang: 'vi' | 'en', onFinal: (text: string) => void) {
  const Ctor: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition : undefined;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => () => recRef.current?.stop?.(), []);

  const start = useCallback(() => {
    if (!Ctor) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else partial += r[0].transcript;
      }
      setInterim(partial);
    };
    rec.onerror = (e: any) => setError(e.error ?? 'error');
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [Ctor, lang]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported: Boolean(Ctor), listening, interim, error, start, stop };
}
