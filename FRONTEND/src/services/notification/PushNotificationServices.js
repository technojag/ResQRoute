// ─── src/services/notifications/PushNotificationService.js ───────────────────
// Handles all push notification logic for ResQRoute
// Works with Firebase Cloud Messaging (FCM) for web push
// Also handles in-app toast notifications when app is in foreground

import { getFCMToken, onForegroundMessage, NOTIFICATION_TYPES } from '../../config/firebase.config';

// ─── In-App Notification Queue ────────────────────────────────────────────────
// Since we don't use a UI library, we manage a simple listener pattern
const listeners = new Map();
let notificationQueue = [];
const MAX_QUEUE = 10;

// ─── Sound Effects (Web Audio API) ────────────────────────────────────────────
const playNotificationSound = (type = 'default') => {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const sounds = {
      emergency: [880, 660, 880, 660],    // High urgency — alternating tones
      arrived:   [523, 659, 784],          // Ascending — positive arrival
      default:   [440, 480],               // Gentle chime
      laneClear: [330, 440, 550, 440],     // Warning pattern
    };

    const tones = sounds[type] || sounds.default;
    let time = ctx.currentTime;

    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.start(time);
      osc.stop(time + 0.2);

      time += 0.18;
    });
  } catch (err) {
    // Audio not available — silent fail
  }
};

// ─── Core Service ─────────────────────────────────────────────────────────────
class PushNotificationService {
  constructor() {
    this.fcmToken = null;
    this.initialized = false;
    this.unsubscribeForeground = null;
    this.permissionGranted = false;
  }

  // ── Initialize: Request Permission + Get Token ─────────────────────────────
  async initialize() {
    if (this.initialized) return this.fcmToken;

    try {
      // Request FCM device token
      this.fcmToken = await getFCMToken();
      this.permissionGranted = !!this.fcmToken;

      if (this.fcmToken) {
        // Register with backend so server can send targeted pushes
        await this._registerTokenWithBackend(this.fcmToken);

        // Listen for foreground messages (app is open)
        this.unsubscribeForeground = onForegroundMessage((payload) => {
          this._handleForegroundMessage(payload);
        });

        console.log('[PushNotification] Service initialized ✅');
      } else {
        console.warn('[PushNotification] Permission denied — notifications disabled');
      }

      this.initialized = true;
      return this.fcmToken;

    } catch (error) {
      console.error('[PushNotification] Init error:', error);
      this.initialized = true; // Mark as initialized even on error to prevent retry loops
      return null;
    }
  }

  // ── Register FCM Token with Backend ───────────────────────────────────────
  async _registerTokenWithBackend(token) {
    try {
      const authToken = localStorage.getItem('rr_token');
      if (!authToken) return; // Not logged in yet

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/register-fcm-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            fcmToken: token,
            platform: 'web',
            deviceInfo: {
              userAgent: navigator.userAgent,
              language:  navigator.language,
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn('[PushNotification] Backend token registration failed');
      }
    } catch (error) {
      console.error('[PushNotification] Backend registration error:', error);
    }
  }

  // ── Handle Foreground Message ─────────────────────────────────────────────
  _handleForegroundMessage(payload) {
    const { title, body, data, type } = payload;

    // Add to queue
    const notification = {
      id:        Date.now(),
      title,
      body,
      data,
      type:      type || NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      timestamp: new Date(),
      read:      false,
    };

    notificationQueue = [notification, ...notificationQueue].slice(0, MAX_QUEUE);

    // Determine sound type
    const soundMap = {
      [NOTIFICATION_TYPES.AMBULANCE_DISPATCHED]:  'emergency',
      [NOTIFICATION_TYPES.FIRE_TRUCK_DISPATCHED]: 'emergency',
      [NOTIFICATION_TYPES.AMBULANCE_ARRIVED]:     'arrived',
      [NOTIFICATION_TYPES.FIRE_TRUCK_ON_SCENE]:   'arrived',
      [NOTIFICATION_TYPES.LANE_CLEAR_ALERT]:      'laneClear',
    };

    playNotificationSound(soundMap[type] || 'default');

    // Notify all listeners
    listeners.forEach((callback) => callback(notification));

    // Also show native browser notification if app is in background tab
    if (document.hidden && this.permissionGranted) {
      this._showNativeNotification(title, body, data);
    }
  }

  // ── Show Native Browser Notification ──────────────────────────────────────
  _showNativeNotification(title, body, data = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const iconMap = {
      medical: '/icons/ambulance-icon.png',
      fire:    '/icons/firetruck-icon.png',
      default: '/icons/resqroute-icon.png',
    };

    try {
      const notification = new Notification(title, {
        body,
        icon:  iconMap[data.emergencyType] || iconMap.default,
        badge: '/icons/badge-icon.png',
        tag:   data.bookingId || 'resqroute',
        data,
        requireInteraction: data.requireInteraction === 'true',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();

        // Navigate to tracking screen
        if (data.bookingId) {
          window.dispatchEvent(new CustomEvent('notification:navigate', {
            detail: { screen: 'tracking', bookingId: data.bookingId, type: data.emergencyType }
          }));
        }
      };
    } catch (error) {
      console.error('[PushNotification] Native notification error:', error);
    }
  }

  // ── Subscribe to In-App Notifications ─────────────────────────────────────
  /**
   * Subscribe to incoming notifications
   * @param {string} listenerId  - Unique ID for this subscriber (e.g. component name)
   * @param {Function} callback  - Called with notification object
   */
  subscribe(listenerId, callback) {
    listeners.set(listenerId, callback);
    return () => listeners.delete(listenerId); // Returns unsubscribe function
  }

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  unsubscribe(listenerId) {
    listeners.delete(listenerId);
  }

  // ── Get Notification Queue ─────────────────────────────────────────────────
  getQueue() {
    return [...notificationQueue];
  }

  // ── Mark Notification Read ─────────────────────────────────────────────────
  markRead(notificationId) {
    notificationQueue = notificationQueue.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
  }

  // ── Mark All Read ──────────────────────────────────────────────────────────
  markAllRead() {
    notificationQueue = notificationQueue.map(n => ({ ...n, read: true }));
  }

  // ── Clear Queue ────────────────────────────────────────────────────────────
  clearQueue() {
    notificationQueue = [];
  }

  // ── Get Unread Count ───────────────────────────────────────────────────────
  getUnreadCount() {
    return notificationQueue.filter(n => !n.read).length;
  }

  // ── Simulate Notification (for demo/testing) ───────────────────────────────
  /**
   * Fire a simulated notification — useful for demo mode when backend isn't connected
   * @param {string} type - NOTIFICATION_TYPES value
   * @param {Object} overrides - Override title/body/data
   */
  simulateNotification(type = NOTIFICATION_TYPES.AMBULANCE_DISPATCHED, overrides = {}) {
    const defaults = {
      [NOTIFICATION_TYPES.AMBULANCE_DISPATCHED]: {
        title: '🚑 Ambulance Dispatched!',
        body:  'AMB-23 is on the way · ETA: ~8 minutes',
        data:  { emergencyType: 'medical', vehicleId: 'AMB-23' },
      },
      [NOTIFICATION_TYPES.AMBULANCE_NEARBY]: {
        title: '⚡ Ambulance Almost Here!',
        body:  'Less than 1 km away. Prepare to receive care.',
        data:  { emergencyType: 'medical', vehicleId: 'AMB-23' },
      },
      [NOTIFICATION_TYPES.AMBULANCE_ARRIVED]: {
        title: '✅ Ambulance Arrived',
        body:  'Your ambulance has reached your location.',
        data:  { emergencyType: 'medical', vehicleId: 'AMB-23' },
      },
      [NOTIFICATION_TYPES.FIRE_TRUCK_DISPATCHED]: {
        title: '🚒 Fire Units Dispatched!',
        body:  '3 fire trucks + HazMat unit responding · ETA: ~5 minutes',
        data:  { emergencyType: 'fire', vehicleId: 'FT-47' },
      },
      [NOTIFICATION_TYPES.LANE_CLEAR_ALERT]: {
        title: '🚨 CLEAR THE LANE!',
        body:  'Emergency vehicle approaching. Move to left side immediately.',
        data:  { emergencyType: 'medical', type: NOTIFICATION_TYPES.LANE_CLEAR_ALERT },
      },
    };

    const base = defaults[type] || defaults[NOTIFICATION_TYPES.AMBULANCE_DISPATCHED];
    const payload = { ...base, ...overrides, type };

    this._handleForegroundMessage(payload);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  destroy() {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    listeners.clear();
    notificationQueue = [];
    this.initialized = false;
    this.fcmToken = null;
  }

  // ── Check Permission Status ────────────────────────────────────────────────
  getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }

  // ── Get FCM Token ──────────────────────────────────────────────────────────
  getToken() {
    return this.fcmToken || localStorage.getItem('rr_fcm_token');
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

// Named exports for convenience
export { NOTIFICATION_TYPES, playNotificationSound };