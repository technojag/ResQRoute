// ─── src/services/api/hospitalApi.js ─────────────────────────────────────────
// Hospital API — fetches government & private hospital data
// Connects to your Node.js backend which then queries the MongoDB hospitals collection

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
  res  => res.data,
  err  => Promise.reject(err?.response?.data || { message: err.message })
);

// ─── Government Hospitals ─────────────────────────────────────────────────────

/**
 * Get the nearest capable government hospital for a given emergency type
 * Backend auto-selects based on: distance, specialty match, available beds
 * @param {number} lat
 * @param {number} lng
 * @param {string} emergencyType - e.g. 'cardiac', 'trauma', 'burns'
 * @returns {Object} { hospital: { name, address, distance, eta, beds, specialties, scheme } }
 */
export const getNearestGovernmentHospital = (lat, lng, emergencyType = '') =>
  api.get('/hospitals/government/nearest', {
    params: { lat, lng, emergencyType },
  });

/**
 * Get all government hospitals near a location
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - Search radius in meters (default 15km)
 * @param {Object} filters - { specialties, minBeds, ayushmanOnly }
 */
export const getNearbyGovernmentHospitals = (lat, lng, radius = 15000, filters = {}) =>
  api.get('/hospitals/government', {
    params: { lat, lng, radius, ...filters },
  });

/**
 * Get details + real-time bed availability for a specific government hospital
 * @param {string} hospitalId
 */
export const getGovernmentHospitalById = (hospitalId) =>
  api.get(`/hospitals/government/${hospitalId}`);

// ─── Private Hospitals ────────────────────────────────────────────────────────

/**
 * Get AI-powered private hospital recommendations for the given emergency
 * Calls your Python AI service → hospital_matching_controller.py
 * @param {number} lat
 * @param {number} lng
 * @param {string} emergencyType
 * @param {Object} patientData - { age, gender, bloodGroup, indicators, insuranceProvider }
 * @returns {Array} Top 3–5 hospitals sorted by match %
 */
export const getAIPrivateHospitalRecommendations = (lat, lng, emergencyType, patientData = {}) =>
  api.post('/hospitals/private/ai-recommend', {
    lat,
    lng,
    emergencyType,
    patientData,
  });

/**
 * Get list of all private hospitals (manual selection mode)
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - Search radius in meters (default 20km)
 * @param {Object} filters - { specialties, insurance, minRating, maxCost }
 */
export const getNearbyPrivateHospitals = (lat, lng, radius = 20000, filters = {}) =>
  api.get('/hospitals/private', {
    params: { lat, lng, radius, ...filters },
  });

/**
 * Get details + pricing + real-time ER availability for a specific private hospital
 * @param {string} hospitalId
 */
export const getPrivateHospitalById = (hospitalId) =>
  api.get(`/hospitals/private/${hospitalId}`);

/**
 * Check insurance acceptance at a specific hospital
 * @param {string} hospitalId
 * @param {string} insuranceProvider - e.g. 'Star Health', 'HDFC Ergo'
 */
export const checkInsuranceAcceptance = (hospitalId, insuranceProvider) =>
  api.get(`/hospitals/private/${hospitalId}/insurance`, {
    params: { provider: insuranceProvider },
  });

// ─── Shared / Both Types ──────────────────────────────────────────────────────

/**
 * Search hospitals by name or area
 * @param {string} query - Search term
 * @param {string} type - 'government' | 'private' | 'all'
 * @param {number} lat
 * @param {number} lng
 */
export const searchHospitals = (query, type = 'all', lat, lng) =>
  api.get('/hospitals/search', {
    params: { q: query, type, lat, lng },
  });

/**
 * Get real-time ER wait time for a hospital
 * @param {string} hospitalId
 */
export const getERWaitTime = (hospitalId) =>
  api.get(`/hospitals/${hospitalId}/er-wait`);

/**
 * Get hospital specialties and department availability
 * @param {string} hospitalId
 */
export const getHospitalSpecialties = (hospitalId) =>
  api.get(`/hospitals/${hospitalId}/specialties`);

/**
 * Pre-alert hospital that patient is incoming (called after ambulance dispatch)
 * @param {string} hospitalId
 * @param {Object} preAlertData - { patientName, age, emergencyType, eta, vehicleId }
 */
export const sendHospitalPreAlert = (hospitalId, preAlertData) =>
  api.post(`/hospitals/${hospitalId}/pre-alert`, preAlertData);

/**
 * Get Ayushman Bharat scheme details and eligibility
 * @param {string} hospitalId
 * @param {string} patientAadhaar - optional, for eligibility check
 */
export const getAyushmanDetails = (hospitalId, patientAadhaar = '') =>
  api.get(`/hospitals/${hospitalId}/ayushman`, {
    params: patientAadhaar ? { aadhaar: patientAadhaar } : {},
  });

// ─── Mock Data for Demo / Offline Mode ───────────────────────────────────────
/**
 * Returns mock government hospital data when backend is offline
 * Use during demo/hackathon presentations if backend isn't running
 */
export const getMockGovernmentHospital = () => ({
  id: 'aiims-delhi',
  name: 'AIIMS — All India Institute of Medical Sciences',
  type: 'Government / Central',
  address: 'Ansari Nagar East, New Delhi — 110029',
  distance: '3.8 km',
  eta: '8 min',
  rating: '4.6',
  beds: { total: 2500, available: 47, icu: 8 },
  specialties: ['Trauma', 'Cardiology', 'Neurology', 'Burns', 'Orthopaedics', 'ICU'],
  scheme: 'Ayushman Bharat',
  cost: 'FREE / Subsidized',
  status: 'READY',
  contact: '+91-11-2658-8500',
  lat: 28.5673,
  lng: 77.2100,
});

/**
 * Returns mock private hospital AI recommendations when backend is offline
 */
export const getMockPrivateRecommendations = () => ([
  {
    id: 'apollo-delhi',
    name: 'Apollo Hospital',
    match: 95,
    distance: '5.2 km',
    eta: '11 min',
    cost: '₹25,000+',
    rating: 4.8,
    insurance: true,
    specialties: ['Cardiology', 'ICU', 'Neurology'],
    tier: 'AI PICK #1',
    address: 'Mathura Road, New Delhi',
  },
  {
    id: 'fortis-delhi',
    name: 'Fortis Healthcare',
    match: 90,
    distance: '7.1 km',
    eta: '14 min',
    cost: '₹30,000+',
    rating: 4.7,
    insurance: true,
    specialties: ['Cardiology', 'Trauma'],
    tier: 'AI PICK #2',
    address: 'Vasant Kunj, New Delhi',
  },
  {
    id: 'max-delhi',
    name: 'Max Super Speciality',
    match: 85,
    distance: '9.4 km',
    eta: '18 min',
    cost: '₹35,000+',
    rating: 4.6,
    insurance: true,
    specialties: ['Multi-Specialty', 'ICU'],
    tier: 'AI PICK #3',
    address: 'Saket, New Delhi',
  },
]);

// ─── Bundle Export ────────────────────────────────────────────────────────────
const hospitalApi = {
  getNearestGovernmentHospital,
  getNearbyGovernmentHospitals,
  getGovernmentHospitalById,
  getAIPrivateHospitalRecommendations,
  getNearbyPrivateHospitals,
  getPrivateHospitalById,
  checkInsuranceAcceptance,
  searchHospitals,
  getERWaitTime,
  getHospitalSpecialties,
  sendHospitalPreAlert,
  getAyushmanDetails,
  getMockGovernmentHospital,
  getMockPrivateRecommendations,
};

export default hospitalApi;