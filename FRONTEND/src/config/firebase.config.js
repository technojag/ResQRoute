// ─── src/config/firebase.config.js ───────────────────────────────────────────
// Firebase configuration for Push Notifications (FCM) and optional Auth
// Replace all values with your actual Firebase project credentials
// Get these from: Firebase Console → Project Settings → Your apps → Config

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

// ─── Firebase Project Config ──────────────────────────────────────────────────
// These values come from your .env file — never hardcode in production
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            || 'AIzaSy-REPLACE-WITH-YOUR-FIREBASE-KEY',
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        || 'your-project.firebaseapp.com',
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         || 'your-project-id',
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || 'your-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             process.env.REACT_APP_FIREBASE_APP_ID             || '1:000000000000:web:abcdef1234567890',
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID    || 'G-XXXXXXXXXX',
};

// ─── VAPID Key for Web Push ───────────────────────────────────────────────────
// Generate from: Firebase Console → Project Settings → Cloud Messaging → Web Push Certificates
export const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || 'YOUR-VAPID-KEY-HERE';

// ─── Initialize Firebase App ──────────────────────────────────────────────────
let app;
let messaging;
let analytics;

try {
  app = initializeApp(firebaseConfig);

  // Firebase Cloud Messaging — for push notifications
  // Only available in browser environments with notification support
  if (typeof window !== 'undefined' && 'Notification' in window) {
    messaging = getMessaging(app);
  }

  // Firebase Analytics — optional, for usage tracking
  if (process.env.NODE_ENV === 'production') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('[Firebase] Initialization failed — push notifications disabled:', error.message);
}

// ─── Helper: Request FCM Token ────────────────────────────────────────────────
/**
 * Request permission and get FCM device token
 * This token is sent to the backend to register for push notifications
 * @returns {string|null} FCM device token or null if denied/unavailable
 */
export const getFCMToken = async () => {
  if (!messaging) {
    console.warn('[FCM] Messaging not available in this environment');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied by user');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      console.log('[FCM] Device token obtained:', token.substring(0, 20) + '...');
      localStorage.setItem('rr_fcm_token', token);
      return token;
    } else {
      console.warn('[FCM] No registration token available');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
};

// ─── Helper: Listen for Foreground Messages ───────────────────────────────────
/**
 * Set up foreground message listener
 * Called when app is in focus and a push notification arrives
 * @param {Function} callback - Called with { title, body, data }
 * @returns {Function} Unsubscribe function
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);
    const { notification, data } = payload;
    callback({
      title: notification?.title || 'ResQRoute Alert',
      body:  notification?.body  || 'Emergency update',
      data:  data || {},
      type:  data?.type || 'general',
    });
  });
};

// ─── Notification Types for ResQRoute ────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  AMBULANCE_DISPATCHED:   'ambulance_dispatched',
  AMBULANCE_EN_ROUTE:     'ambulance_en_route',
  AMBULANCE_NEARBY:       'ambulance_nearby',
  AMBULANCE_ARRIVED:      'ambulance_arrived',
  FIRE_TRUCK_DISPATCHED:  'fire_truck_dispatched',
  FIRE_TRUCK_EN_ROUTE:    'fire_truck_en_route',
  FIRE_TRUCK_ON_SCENE:    'fire_truck_on_scene',
  LANE_CLEAR_ALERT:       'lane_clear_alert',
  BOOKING_CONFIRMED:      'booking_confirmed',
  BOOKING_CANCELLED:      'booking_cancelled',
  HOSPITAL_READY:         'hospital_ready',
};

export { app, messaging, analytics };
export default app;