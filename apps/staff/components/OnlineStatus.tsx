'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Update online status
    const updateOnlineStatus = () => {
      const wasOffline = !isOnline;
      setIsOnline(navigator.onLine);
      
      // Show status when connection changes
      if (wasOffline !== !navigator.onLine) {
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-20 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span className="text-sm font-medium">Connection Restored</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span className="text-sm font-medium">Offline Mode</span>
        </>
      )}
    </div>
  );
}
