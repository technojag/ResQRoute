import axios from 'axios';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('rr_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rr_token');
      localStorage.removeItem('rr_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error?.response?.data || { message: error.message });
  }
);

// ─── Auth API Methods ─────────────────────────────────────────────────────────

/**
 * Send OTP to user's phone number
 * @param {string} phone - Mobile number with country code e.g. +919876543210
 */
export const sendOTP = (phone) =>
  api.post('/auth/send-otp', { phone });

/**
 * Verify OTP and get JWT token
 * @param {string} phone
 * @param {string} otp - 6-digit OTP
 */
export const verifyOTP = async (phone, otp) => {
  const response = await api.post('/auth/verify-otp', { phone, otp });
  // Store token and user on success
  if (response.token) {
    localStorage.setItem('rr_token', response.token);
    localStorage.setItem('rr_user', JSON.stringify(response.user));
  }
  return response;
};

/**
 * Get current authenticated user profile
 */
export const getProfile = () =>
  api.get('/auth/profile');

/**
 * Update user profile details
 * @param {Object} updates - Fields to update
 */
export const updateProfile = (updates) =>
  api.put('/auth/profile', updates);

/**
 * Log out and clear token
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (_) {
    // Silent fail — always clear local storage
  } finally {
    localStorage.removeItem('rr_token');
    localStorage.removeItem('rr_user');
  }
};

/**
 * Check if user is currently authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('rr_token');
};

/**
 * Get stored user object from localStorage
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('rr_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Resend OTP (rate limited by backend)
 */
export const resendOTP = (phone) =>
  api.post('/auth/resend-otp', { phone });

// Named export bundle
const authApi = {
  sendOTP,
  verifyOTP,
  getProfile,
  updateProfile,
  logout,
  isAuthenticated,
  getStoredUser,
  resendOTP,
};

export default authApi;