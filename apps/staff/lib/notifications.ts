// /apps/staff/lib/notifications.ts
export type StaffNotificationType = 'new_order' | 'customer_approval' | 'customer_rejection' | 'payment_received';

export interface NotificationPreferences {
  soundEnabled: boolean;
}

export class StaffNotificationManager {
  private audioContext: AudioContext | null = null;
  private preferences: NotificationPreferences;
  private notificationQueue: StaffNotificationType[] = [];
  private isPlaying: boolean = false;

  constructor(preferences?: NotificationPreferences) {
    this.preferences = preferences || {
      soundEnabled: true
    };

    // Initialize AudioContext
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
  }

  setPreferences(preferences: NotificationPreferences) {
    this.preferences = preferences;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('staffNotificationPreferences', JSON.stringify(preferences));
    }
  }

  static loadPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return { soundEnabled: true };
    }

    const stored = localStorage.getItem('staffNotificationPreferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse staff notification preferences');
      }
    }

    return { soundEnabled: true };
  }

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

  async playNotificationSound(type: StaffNotificationType) {
    if (!this.preferences.soundEnabled) return;
    if (!await this.ensureAudioContext()) return;
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Staff notification patterns - more urgent/attention-grabbing
    const soundPatterns: Record<StaffNotificationType, { frequencies: number[], durations: number[] }> = {
      new_order: {
        frequencies: [1000, 1200, 1400],
        durations: [0.2, 0.2, 0.3]
      },
      customer_approval: {
        frequencies: [800, 1000],
        durations: [0.15, 0.2]
      },
      customer_rejection: {
        frequencies: [600, 400],
        durations: [0.15, 0.2]
      },
      payment_received: {
        frequencies: [900, 1100, 1300],
        durations: [0.12, 0.12, 0.15]
      }
    };

    const pattern = soundPatterns[type];
    let currentTime = this.audioContext.currentTime;

    pattern.frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, currentTime);
      currentTime += pattern.durations[index];
    });

    gainNode.gain.setValueAtTime(0.35, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(currentTime);
  }

  async triggerNotification(type: StaffNotificationType, options?: { skipQueue?: boolean }) {
    console.log('🔔 Staff notification:', type);

    if (this.isPlaying && !options?.skipQueue) {
      this.notificationQueue.push(type);
      return;
    }

    this.isPlaying = true;

    try {
      await this.playNotificationSound(type);
    } catch (error) {
      console.error('Staff notification error:', error);
    } finally {
      this.isPlaying = false;

      if (this.notificationQueue.length > 0) {
        const nextType = this.notificationQueue.shift();
        if (nextType) {
          setTimeout(() => this.triggerNotification(nextType), 300);
        }
      }
    }
  }

  async testNotification() {
    await this.triggerNotification('new_order', { skipQueue: true });
  }

  static isSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  }
}

// Singleton instance for staff app
let staffNotificationManager: StaffNotificationManager | null = null;

export function getStaffNotificationManager(): StaffNotificationManager {
  if (typeof window === 'undefined') {
    return new StaffNotificationManager({ soundEnabled: false });
  }

  if (!staffNotificationManager) {
    const preferences = StaffNotificationManager.loadPreferences();
    staffNotificationManager = new StaffNotificationManager(preferences);
  }

  return staffNotificationManager;
}