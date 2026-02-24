import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('rr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err?.response?.data || { message: err.message })
);

// ─── Fire Booking API ─────────────────────────────────────────────────────────

/**
 * Create a new fire emergency booking/report
 * @param {Object} bookingData
 * @param {string} bookingData.fireType       - 'structure' | 'vehicle' | 'industrial' | etc.
 * @param {Object} bookingData.fireDetails    - scale, peopleCount, trapped, hazards, notes
 * @param {Object} bookingData.buildingInfo   - buildingType, floors, entryPoints, etc.
 * @param {string} bookingData.vehicleType    - 'water_tender' | 'ladder' | 'hazmat' | 'rescue'
 * @param {Object} bookingData.location       - lat, lng, address, city, pincode
 */
export const createBooking = (bookingData) =>
  api.post('/fire/booking', bookingData);

/**
 * Get a specific fire booking by ID
 * @param {string} bookingId
 */
export const getBooking = (bookingId) =>
  api.get(`/fire/booking/${bookingId}`);

/**
 * Get all fire bookings for authenticated user
 * @param {Object} params - { page, limit, status }
 */
export const getUserBookings = (params = {}) =>
  api.get('/fire/bookings', { params });

/**
 * Cancel an active fire response (admin/verified only)
 * @param {string} bookingId
 * @param {string} reason
 */
export const cancelBooking = (bookingId, reason = '') =>
  api.delete(`/fire/booking/${bookingId}`, { data: { reason } });

/**
 * Update fire details after reporting (e.g. fire has spread)
 * @param {string} bookingId
 * @param {Object} updates - Additional details to update
 */
export const updateFireStatus = (bookingId, updates) =>
  api.patch(`/fire/booking/${bookingId}/status`, updates);

/**
 * Get nearby available fire trucks
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - In meters, default 15000 (15km)
 */
export const getNearbyFireTrucks = (lat, lng, radius = 15000) =>
  api.get('/fire/trucks/nearby', { params: { lat, lng, radius } });

/**
 * Get specific fire truck real-time position
 * @param {string} truckId
 */
export const getFireTruckInfo = (truckId) =>
  api.get(`/fire/trucks/${truckId}`);

/**
 * Get AI fire spread prediction
 * @param {Object} fireData - fireType, scale, location, wind, etc.
 */
export const getSpreadPrediction = (fireData) =>
  api.post('/fire/spread-prediction', fireData);

/**
 * Get AI fire severity classification
 * @param {Object} fireData
 */
export const getFireClassification = (fireData) =>
  api.post('/fire/classify', fireData);

/**
 * Report all clear / fire extinguished
 * @param {string} bookingId
 */
export const reportAllClear = (bookingId) =>
  api.post(`/fire/booking/${bookingId}/all-clear`);

// Bundle export
const fireBookingApi = {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  updateFireStatus,
  getNearbyFireTrucks,
  getFireTruckInfo,
  getSpreadPrediction,
  getFireClassification,
  reportAllClear,
};

export default fireBookingApi;