// /apps/customer/lib/notifications.ts
export type NotificationType = 'order_confirmed' | 'order_ready' | 'staff_order' | 'payment_success' | 'message';

export interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export class NotificationManager {
  private audioContext: AudioContext | null = null;
  private vibrationSupported: boolean = false;
  private preferences: NotificationPreferences;
  private notificationQueue: NotificationType[] = [];
  private isPlaying: boolean = false;

  constructor(preferences?: NotificationPreferences) {
    this.vibrationSupported = 'vibrate' in navigator;
    this.preferences = preferences || {
      soundEnabled: true,
      vibrationEnabled: true
    };

    // Initialize AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
  }

  // Update preferences
  setPreferences(preferences: NotificationPreferences) {
    this.preferences = preferences;
    
    // Save to sessionStorage for persistence during session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    }
  }

  // Load preferences from storage
  static loadPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return { soundEnabled: true, vibrationEnabled: true };
    }

    const stored = sessionStorage.getItem('notificationPreferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse notification preferences');
      }
    }

    return { soundEnabled: true, vibrationEnabled: true };
  }

  // Resume AudioContext if suspended (required by browsers after user interaction)
  private async ensureAudioContext() {
    if (!this.audioContext) return false;

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
        return false;
      }
    }

    return true;
  }

  // Play notification sound using Web Audio API
  async playNotificationSound(type: NotificationType) {
    if (!this.preferences.soundEnabled) return;
    if (!await this.ensureAudioContext()) return;
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Different sound patterns for different notification types
    const soundPatterns: Record<NotificationType, { frequencies: number[], durations: number[] }> = {
      order_confirmed: {
        frequencies: [600, 800],
        durations: [0.1, 0.15]
      },
      order_ready: {
        frequencies: [800, 1000, 1200],
        durations: [0.15, 0.15, 0.2]
      },
      staff_order: {
        frequencies: [500, 700, 500],
        durations: [0.12, 0.12, 0.12]
      },
      payment_success: {
        frequencies: [800, 1200],
        durations: [0.1, 0.2]
      },
      message: {
        frequencies: [1000],
        durations: [0.15]
      }
    };

    const pattern = soundPatterns[type];
    let currentTime = this.audioContext.currentTime;

    // Create frequency ramp
    pattern.frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, currentTime);
      currentTime += pattern.durations[index];
    });

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(currentTime);
  }

  // Trigger vibration
  vibrate(pattern?: number | number[]) {
    if (!this.preferences.vibrationEnabled) return;
    if (!this.vibrationSupported) return;

    const vibrationPatterns: Record<NotificationType, number[]> = {
      order_confirmed: [100, 50, 100],
      order_ready: [200, 100, 200, 100, 200],
      staff_order: [150, 100, 150],
      payment_success: [100, 50, 100],
      message: [100]
    };

    navigator.vibrate(pattern || [200, 100, 200]);
  }

  // Main notification trigger with queueing
  async triggerNotification(type: NotificationType, options?: { skipQueue?: boolean }) {
    console.log('🔔 Triggering notification:', type);

    // If already playing and not skipping queue, add to queue
    if (this.isPlaying && !options?.skipQueue) {
      this.notificationQueue.push(type);
      return;
    }

    this.isPlaying = true;

    try {
      // Play sound and vibration concurrently
      await Promise.all([
        this.playNotificationSound(type),
        Promise.resolve(this.vibrate())
      ]);
    } catch (error) {
      console.error('Notification error:', error);
    } finally {
      this.isPlaying = false;

      // Process queue
      if (this.notificationQueue.length > 0) {
        const nextType = this.notificationQueue.shift();
        if (nextType) {
          // Small delay between notifications
          setTimeout(() => this.triggerNotification(nextType), 300);
        }
      }
    }
  }

  // Test notification (useful for settings page)
  async testNotification() {
    await this.triggerNotification('order_ready', { skipQueue: true });
  }

  // Check if notifications are supported
  static isSupported(): { sound: boolean; vibration: boolean } {
    return {
      sound: typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
      vibration: 'vibrate' in navigator
    };
  }
}

// Singleton instance for customer app
let customerNotificationManager: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (typeof window === 'undefined') {
    // Server-side, return dummy instance
    return new NotificationManager({ soundEnabled: false, vibrationEnabled: false });
  }

  if (!customerNotificationManager) {
    const preferences = NotificationManager.loadPreferences();
    customerNotificationManager = new NotificationManager(preferences);
  }

  return customerNotificationManager;
}