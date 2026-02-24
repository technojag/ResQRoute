// ─── store/actions/fireActions.js ─────────────────────────────────────────────
// Action type constants
export const FIRE_ACTION_TYPES = {
  SET_FIRE_TYPE:        'fire/SET_FIRE_TYPE',
  SET_FIRE_DETAILS:     'fire/SET_FIRE_DETAILS',
  SET_BUILDING_INFO:    'fire/SET_BUILDING_INFO',
  SET_VEHICLE_TYPE:     'fire/SET_VEHICLE_TYPE',
  SET_LOCATION:         'fire/SET_LOCATION',
  SET_BOOKING:          'fire/SET_BOOKING',
  SET_BOOKING_STATUS:   'fire/SET_BOOKING_STATUS',
  SET_TRACKING_DATA:    'fire/SET_TRACKING_DATA',
  SET_VEHICLE_POSITION: 'fire/SET_VEHICLE_POSITION',
  SET_AI_ANALYSIS:      'fire/SET_AI_ANALYSIS',
  SET_SPREAD_PREDICTION:'fire/SET_SPREAD_PREDICTION',
  SET_UNITS_DISPATCHED: 'fire/SET_UNITS_DISPATCHED',
  SET_ETA:              'fire/SET_ETA',
  SET_LOADING:          'fire/SET_LOADING',
  SET_ERROR:            'fire/SET_ERROR',
  CLEAR_BOOKING:        'fire/CLEAR_BOOKING',
  CLEAR_ALL:            'fire/CLEAR_ALL',
};

// ─── Action Creators ──────────────────────────────────────────────────────────

export const setFireType = (fireType) => ({
  type: FIRE_ACTION_TYPES.SET_FIRE_TYPE,
  payload: fireType,
});

export const setFireDetails = (details) => ({
  type: FIRE_ACTION_TYPES.SET_FIRE_DETAILS,
  payload: details,
});

export const setBuildingInfo = (buildingInfo) => ({
  type: FIRE_ACTION_TYPES.SET_BUILDING_INFO,
  payload: buildingInfo,
});

export const setVehicleType = (vehicleType) => ({
  type: FIRE_ACTION_TYPES.SET_VEHICLE_TYPE,
  payload: vehicleType,
});

export const setLocation = (location) => ({
  type: FIRE_ACTION_TYPES.SET_LOCATION,
  payload: location,
});

export const setBooking = (bookingData) => ({
  type: FIRE_ACTION_TYPES.SET_BOOKING,
  payload: bookingData,
});

export const setBookingStatus = (status) => ({
  type: FIRE_ACTION_TYPES.SET_BOOKING_STATUS,
  payload: status,
});

export const setTrackingData = (trackingData) => ({
  type: FIRE_ACTION_TYPES.SET_TRACKING_DATA,
  payload: trackingData,
});

export const setVehiclePosition = (position) => ({
  type: FIRE_ACTION_TYPES.SET_VEHICLE_POSITION,
  payload: position,
});

export const setAIAnalysis = (analysis) => ({
  type: FIRE_ACTION_TYPES.SET_AI_ANALYSIS,
  payload: analysis,
});

export const setSpreadPrediction = (prediction) => ({
  type: FIRE_ACTION_TYPES.SET_SPREAD_PREDICTION,
  payload: prediction,
});

export const setUnitsDispatched = (units) => ({
  type: FIRE_ACTION_TYPES.SET_UNITS_DISPATCHED,
  payload: units,
});

export const setETA = (eta) => ({
  type: FIRE_ACTION_TYPES.SET_ETA,
  payload: eta,
});

export const setLoading = (isLoading) => ({
  type: FIRE_ACTION_TYPES.SET_LOADING,
  payload: isLoading,
});

export const setError = (error) => ({
  type: FIRE_ACTION_TYPES.SET_ERROR,
  payload: error,
});

export const clearBooking = () => ({
  type: FIRE_ACTION_TYPES.CLEAR_BOOKING,
});

export const clearAll = () => ({
  type: FIRE_ACTION_TYPES.CLEAR_ALL,
});

// ─── Thunk Actions (async with API) ──────────────────────────────────────────

export const createFireBooking = (bookingData) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const { fireBookingApi } = await import('../../services/api/fireBookingApi');
    const response = await fireBookingApi.createBooking(bookingData);
    dispatch(setBooking(response.booking));
    dispatch(setBookingStatus('booked'));
    if (response.aiAnalysis) dispatch(setAIAnalysis(response.aiAnalysis));
    if (response.unitsDispatched) dispatch(setUnitsDispatched(response.unitsDispatched));
    dispatch(setLoading(false));
    return response;
  } catch (error) {
    dispatch(setError(error.message || 'Fire report failed. Please call 101 directly.'));
    dispatch(setLoading(false));
    throw error;
  }
};

export const fetchAIFireAnalysis = (fireData) => async (dispatch) => {
  try {
    // Calls Python AI service for fire classification + spread prediction
    const response = await fetch(`${process.env.REACT_APP_AI_URL || 'http://localhost:8000'}/api/fire/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fireData),
    });
    const data = await response.json();
    dispatch(setAIAnalysis(data.classification));
    dispatch(setSpreadPrediction(data.spreadPrediction));
    return data;
  } catch (error) {
    console.error('[Fire AI Analysis Error]', error);
  }
};

export const cancelFireBooking = (bookingId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { fireBookingApi } = await import('../../services/api/fireBookingApi');
    await fireBookingApi.cancelBooking(bookingId);
    dispatch(clearBooking());
    dispatch(setBookingStatus('cancelled'));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};