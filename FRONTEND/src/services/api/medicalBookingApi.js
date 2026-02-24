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

// ─── Medical Booking API ──────────────────────────────────────────────────────

/**
 * Create a new medical/ambulance booking
 * @param {Object} bookingData
 * @param {string} bookingData.emergencyType  - e.g. 'cardiac', 'trauma'
 * @param {Object} bookingData.patientDetails - name, age, gender, bloodGroup, etc.
 * @param {string} bookingData.vehicleType    - e.g. 'basic', 'advanced', 'cardiac'
 * @param {string} bookingData.hospitalPreference - 'government' | 'private'
 * @param {string} bookingData.selectedHospitalId - ID of private hospital (if private)
 * @param {Object} bookingData.location       - lat, lng, address, city, pincode
 */
export const createBooking = (bookingData) =>
  api.post('/medical/booking', bookingData);

/**
 * Get a specific booking by ID
 * @param {string} bookingId
 */
export const getBooking = (bookingId) =>
  api.get(`/medical/booking/${bookingId}`);

/**
 * Get all bookings for the current authenticated user
 * @param {Object} params - { page, limit, status }
 */
export const getUserBookings = (params = {}) =>
  api.get('/medical/bookings', { params });

/**
 * Cancel an active booking
 * @param {string} bookingId
 * @param {string} reason - Cancellation reason
 */
export const cancelBooking = (bookingId, reason = '') =>
  api.delete(`/medical/booking/${bookingId}`, { data: { reason } });

/**
 * Get nearby available ambulances
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - In meters, default 10000 (10km)
 */
export const getNearbyAmbulances = (lat, lng, radius = 10000) =>
  api.get(`/medical/ambulances/nearby`, { params: { lat, lng, radius } });

/**
 * Get ambulance real-time info (position, ETA)
 * @param {string} ambulanceId
 */
export const getAmbulanceInfo = (ambulanceId) =>
  api.get(`/medical/ambulances/${ambulanceId}`);

/**
 * Rate/review a completed booking
 * @param {string} bookingId
 * @param {Object} review - { rating, comment }
 */
export const rateBooking = (bookingId, review) =>
  api.post(`/medical/booking/${bookingId}/review`, review);

/**
 * Get patient triage result from AI
 * @param {Object} patientData - symptoms, indicators, age, etc.
 */
export const getTriageResult = (patientData) =>
  api.post('/medical/triage', patientData);

// Bundle export
const medicalBookingApi = {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  getNearbyAmbulances,
  getAmbulanceInfo,
  rateBooking,
  getTriageResult,
};

export default medicalBookingApi;