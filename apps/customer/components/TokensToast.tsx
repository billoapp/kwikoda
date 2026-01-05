'use client';

import { useEffect, useState } from 'react';

interface TokensToastProps {
  amount: number;
  show: boolean;
  onClose: () => void;
}

export function TokensToast({ amount, show, onClose }: TokensToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
        <span className="text-2xl">🎉</span>
        <span className="font-bold">+{amount} tokens earned!</span>
      </div>
    </div>
  );
}
