import { useCallback, useEffect, useRef } from 'react';

export function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Create audio element on client only
    if (typeof window === 'undefined') return;
    audioRef.current = new Audio(src);
    audioRef.current.preload = 'auto';
    // WebAudio context for synthetic fallback
    ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, [src]);

  const play = useCallback(async () => {
    if (!audioRef.current || !ctxRef.current) return;

    try {
      // 1. Try file
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch {
      // 2. Blocked? use WebAudio synthetic beep
      const osc = ctxRef.current.createOscillator();
      const gain = ctxRef.current.createGain();
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.connect(gain).connect(ctxRef.current.destination);
      osc.start();
      osc.stop(ctxRef.current.currentTime + 0.12);
    }
  }, []);

  return play;
}
