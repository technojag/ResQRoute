// ─── store/actions/medicalActions.js ─────────────────────────────────────────
// Action type constants
export const MEDICAL_ACTION_TYPES = {
  SET_EMERGENCY_TYPE:    'medical/SET_EMERGENCY_TYPE',
  SET_PATIENT_DETAILS:   'medical/SET_PATIENT_DETAILS',
  SET_VEHICLE_TYPE:      'medical/SET_VEHICLE_TYPE',
  SET_HOSPITAL_PREF:     'medical/SET_HOSPITAL_PREF',
  SET_SELECTED_HOSPITAL: 'medical/SET_SELECTED_HOSPITAL',
  SET_LOCATION:          'medical/SET_LOCATION',
  SET_BOOKING:           'medical/SET_BOOKING',
  SET_BOOKING_STATUS:    'medical/SET_BOOKING_STATUS',
  SET_TRACKING_DATA:     'medical/SET_TRACKING_DATA',
  SET_VEHICLE_POSITION:  'medical/SET_VEHICLE_POSITION',
  SET_ETA:               'medical/SET_ETA',
  SET_LOADING:           'medical/SET_LOADING',
  SET_ERROR:             'medical/SET_ERROR',
  CLEAR_BOOKING:         'medical/CLEAR_BOOKING',
  CLEAR_ALL:             'medical/CLEAR_ALL',
};

// ─── Action Creators ──────────────────────────────────────────────────────────

export const setEmergencyType = (emergencyType) => ({
  type: MEDICAL_ACTION_TYPES.SET_EMERGENCY_TYPE,
  payload: emergencyType,
});

export const setPatientDetails = (patientDetails) => ({
  type: MEDICAL_ACTION_TYPES.SET_PATIENT_DETAILS,
  payload: patientDetails,
});

export const setVehicleType = (vehicleType) => ({
  type: MEDICAL_ACTION_TYPES.SET_VEHICLE_TYPE,
  payload: vehicleType,
});

export const setHospitalPreference = (preference) => ({
  type: MEDICAL_ACTION_TYPES.SET_HOSPITAL_PREF,
  payload: preference,
});

export const setSelectedHospital = (hospital) => ({
  type: MEDICAL_ACTION_TYPES.SET_SELECTED_HOSPITAL,
  payload: hospital,
});

export const setLocation = (location) => ({
  type: MEDICAL_ACTION_TYPES.SET_LOCATION,
  payload: location,
});

export const setBooking = (bookingData) => ({
  type: MEDICAL_ACTION_TYPES.SET_BOOKING,
  payload: bookingData,
});

export const setBookingStatus = (status) => ({
  type: MEDICAL_ACTION_TYPES.SET_BOOKING_STATUS,
  payload: status,
});

export const setTrackingData = (trackingData) => ({
  type: MEDICAL_ACTION_TYPES.SET_TRACKING_DATA,
  payload: trackingData,
});

export const setVehiclePosition = (position) => ({
  type: MEDICAL_ACTION_TYPES.SET_VEHICLE_POSITION,
  payload: position,
});

export const setETA = (eta) => ({
  type: MEDICAL_ACTION_TYPES.SET_ETA,
  payload: eta,
});

export const setLoading = (isLoading) => ({
  type: MEDICAL_ACTION_TYPES.SET_LOADING,
  payload: isLoading,
});

export const setError = (error) => ({
  type: MEDICAL_ACTION_TYPES.SET_ERROR,
  payload: error,
});

export const clearBooking = () => ({
  type: MEDICAL_ACTION_TYPES.CLEAR_BOOKING,
});

export const clearAll = () => ({
  type: MEDICAL_ACTION_TYPES.CLEAR_ALL,
});

// ─── Thunk Actions (async with API) ──────────────────────────────────────────

export const createMedicalBooking = (bookingData) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    // Import API dynamically to avoid circular deps
    const { medicalBookingApi } = await import('../../services/api/medicalBookingApi');
    const response = await medicalBookingApi.createBooking(bookingData);
    dispatch(setBooking(response.booking));
    dispatch(setBookingStatus('booked'));
    dispatch(setLoading(false));
    return response;
  } catch (error) {
    dispatch(setError(error.message || 'Booking failed. Please try again.'));
    dispatch(setLoading(false));
    throw error;
  }
};

export const fetchNearbyAmbulances = (lat, lng) => async (dispatch) => {
  try {
    const { medicalBookingApi } = await import('../../services/api/medicalBookingApi');
    const response = await medicalBookingApi.getNearbyAmbulances(lat, lng);
    return response;
  } catch (error) {
    dispatch(setError(error.message));
  }
};

export const cancelMedicalBooking = (bookingId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { medicalBookingApi } = await import('../../services/api/medicalBookingApi');
    await medicalBookingApi.cancelBooking(bookingId);
    dispatch(clearBooking());
    dispatch(setBookingStatus('cancelled'));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};