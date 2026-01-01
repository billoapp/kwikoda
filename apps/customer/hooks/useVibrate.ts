import { useCallback } from 'react';

export function useVibrate() {
  const supported = typeof window !== 'undefined' && 'vibrate' in navigator;

  const buzz = useCallback((pattern: number | number[] = 200) => {
    if (supported) navigator.vibrate(pattern);
  }, [supported]);

  return { supported, buzz };
}
