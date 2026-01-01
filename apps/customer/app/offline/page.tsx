'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Update online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
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
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    // Try to refresh the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
            isOnline ? 'bg-green-100' : 'bg-red-100'
          } transition-colors duration-300`}>
            {isOnline ? (
              <Wifi className="w-12 h-12 text-green-600" />
            ) : (
              <WifiOff className="w-12 h-12 text-red-600" />
            )}
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isOnline ? 'Connection Restored' : 'You\'re Offline'}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {isOnline 
            ? 'Your internet connection is back. You can continue using the app.'
            : 'Please check your internet connection and try again.'
          }
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          {isOnline ? (
            <button
              onClick={() => window.history.back()}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              Continue Browsing
            </button>
          ) : (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </>
              )}
            </button>
          )}
        </div>

        {/* Offline Features Notice */}
        {!isOnline && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Offline Features:</strong><br />
              • View previously loaded tabs<br />
              • Access cached menu items<br />
              • View order history
            </p>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-6">
          <p className={`text-sm ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            Status: {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
    </div>
  );
}
