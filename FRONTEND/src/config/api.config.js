// ─── src/config/api.config.js ─────────────────────────────────────────────────
// Central API configuration for all services
// These values are overridden by environment variables in .env

const API_CONFIG = {
  // ── Node.js Backend ──────────────────────────────────────────────────────────
  BASE_URL:    process.env.REACT_APP_API_URL    || 'http://localhost:5000/api',
  SOCKET_URL:  process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',

  // ── Python AI Service ────────────────────────────────────────────────────────
  AI_URL:      process.env.REACT_APP_AI_URL     || 'http://localhost:8000',

  // ── Google Maps ──────────────────────────────────────────────────────────────
  MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',

  // ── Request Timeouts (ms) ────────────────────────────────────────────────────
  TIMEOUT:          10000,   // 10s  — standard requests
  LONG_TIMEOUT:     30000,   // 30s  — booking / AI calls
  UPLOAD_TIMEOUT:   60000,   // 60s  — file uploads

  // ── Polling Intervals (ms) ───────────────────────────────────────────────────
  TRACKING_POLL_INTERVAL: 3000,   // Re-fetch vehicle position every 3s (fallback if socket fails)
  STATUS_POLL_INTERVAL:   5000,   // Re-fetch booking status every 5s

  // ── Retry Config ─────────────────────────────────────────────────────────────
  MAX_RETRIES:    3,
  RETRY_DELAY_MS: 1500,

  // ── API Version ──────────────────────────────────────────────────────────────
  API_VERSION: 'v1',
};

// ─── Endpoint Builders ────────────────────────────────────────────────────────

export const ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_OTP:    '/auth/send-otp',
    VERIFY_OTP:  '/auth/verify-otp',
    RESEND_OTP:  '/auth/resend-otp',
    LOGOUT:      '/auth/logout',
    PROFILE:     '/auth/profile',
  },

  // Medical / Ambulance
  MEDICAL: {
    BOOKING:               '/medical/booking',
    BOOKING_BY_ID:         (id) => `/medical/booking/${id}`,
    BOOKINGS_LIST:         '/medical/bookings',
    AMBULANCES_NEARBY:     '/medical/ambulances/nearby',
    AMBULANCE_BY_ID:       (id) => `/medical/ambulances/${id}`,
    TRIAGE:                '/medical/triage',
    BOOKING_REVIEW:        (id) => `/medical/booking/${id}/review`,
  },

  // Fire / Fire Trucks
  FIRE: {
    BOOKING:               '/fire/booking',
    BOOKING_BY_ID:         (id) => `/fire/booking/${id}`,
    BOOKINGS_LIST:         '/fire/bookings',
    TRUCKS_NEARBY:         '/fire/trucks/nearby',
    TRUCK_BY_ID:           (id) => `/fire/trucks/${id}`,
    SPREAD_PREDICTION:     '/fire/spread-prediction',
    CLASSIFY:              '/fire/classify',
    ALL_CLEAR:             (id) => `/fire/booking/${id}/all-clear`,
    UPDATE_STATUS:         (id) => `/fire/booking/${id}/status`,
  },

  // Hospitals
  HOSPITALS: {
    GOVT_NEAREST:          '/hospitals/government/nearest',
    PRIVATE_AI_RECOMMEND:  '/hospitals/private/ai-recommend',
    PRIVATE_LIST:          '/hospitals/private',
    HOSPITAL_BY_ID:        (id) => `/hospitals/${id}`,
    SEARCH:                '/hospitals/search',
  },

  // AI Service (Python — different base URL)
  AI: {
    AMBULANCE_ROUTE:       '/api/medical/ambulance-route',
    HOSPITAL_MATCH:        '/api/medical/hospital-match',
    TRIAGE:                '/api/medical/triage',
    FIRE_ROUTE:            '/api/fire/firetruck-route',
    FIRE_SEVERITY:         '/api/fire/severity',
    FIRE_SPREAD:           '/api/fire/spread-prediction',
    COORDINATION:          '/api/unified/coordinate',
  },

  // WebSocket Events
  SOCKET_EVENTS: {
    // Client → Server
    TRACK_BOOKING:              'track_booking',
    UNTRACK_BOOKING:            'untrack_booking',
    SUBSCRIBE_LANE_CLEAR:       'subscribe_lane_clear',
    DRIVER_LOCATION_UPDATE:     'driver_location_update',

    // Server → Client
    VEHICLE_POSITION:           'vehicle_position',
    BOOKING_STATUS_UPDATE:      'booking_status_update',
    ETA_UPDATE:                 'eta_update',
    LANE_CLEAR_ALERT:           'lane_clear_alert',
    ARRIVAL_NOTIFICATION:       'arrival_notification',
    MULTI_UNIT_UPDATE:          'multi_unit_update',
  },
};

// ─── HTTP Status Codes ────────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK:                   200,
  CREATED:              201,
  NO_CONTENT:           204,
  BAD_REQUEST:          400,
  UNAUTHORIZED:         401,
  FORBIDDEN:            403,
  NOT_FOUND:            404,
  CONFLICT:             409,
  UNPROCESSABLE:        422,
  TOO_MANY_REQUESTS:    429,
  INTERNAL_ERROR:       500,
  SERVICE_UNAVAILABLE:  503,
};

// ─── App-Wide Constants ───────────────────────────────────────────────────────
export const APP_CONSTANTS = {
  APP_NAME:           'ResQRoute',
  VERSION:            '1.0.0',
  DEFAULT_CITY:       'New Delhi',
  DEFAULT_LAT:        28.6139,
  DEFAULT_LNG:        77.2090,
  DEFAULT_ZOOM:       14,
  NEARBY_RADIUS_M:    10000,    // 10 km radius for nearby vehicles
  LANE_CLEAR_RADIUS_M: 2000,   // 2 km radius for lane clear alerts
  MAX_BOOKING_ATTEMPTS: 3,
  OTP_LENGTH:         6,
  OTP_EXPIRY_MIN:     5,
};

export default API_CONFIG;