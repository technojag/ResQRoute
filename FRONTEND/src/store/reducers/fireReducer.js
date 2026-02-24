import { FIRE_ACTION_TYPES } from '../actions/fireActions';

// ─── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  // Booking form data
  fireType: null,
  fireDetails: {
    scale: null,
    peopleCount: '',
    trapped: '',
    notes: '',
    hazards: [],
  },
  buildingInfo: {
    buildingType: null,
    totalFloors: '',
    fireFloor: '',
    basements: '',
    entryPoints: '',
    staircases: '',
    constructionType: null,
    infrastructure: [],
    waterSource: null,
    buildingName: '',
    notes: '',
  },
  vehicleType: null,
  location: {
    lat: null,
    lng: null,
    address: '',
    city: '',
    pincode: '',
    landmark: '',
  },

  // Booking result
  booking: null,
  bookingStatus: 'idle',  // idle | loading | booked | en_route | on_scene | extinguished | cancelled | error

  // AI outputs
  aiAnalysis: null,
  spreadPrediction: null,
  unitsDispatched: [],

  // Live tracking
  trackingData: null,
  vehiclePosition: null,
  eta: null,

  // UI state
  isLoading: false,
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const fireReducer = (state = initialState, action) => {
  switch (action.type) {

    case FIRE_ACTION_TYPES.SET_FIRE_TYPE:
      return { ...state, fireType: action.payload };

    case FIRE_ACTION_TYPES.SET_FIRE_DETAILS:
      return {
        ...state,
        fireDetails: { ...state.fireDetails, ...action.payload },
      };

    case FIRE_ACTION_TYPES.SET_BUILDING_INFO:
      return {
        ...state,
        buildingInfo: { ...state.buildingInfo, ...action.payload },
      };

    case FIRE_ACTION_TYPES.SET_VEHICLE_TYPE:
      return { ...state, vehicleType: action.payload };

    case FIRE_ACTION_TYPES.SET_LOCATION:
      return {
        ...state,
        location: { ...state.location, ...action.payload },
      };

    case FIRE_ACTION_TYPES.SET_BOOKING:
      return {
        ...state,
        booking: action.payload,
        bookingStatus: 'booked',
        isLoading: false,
      };

    case FIRE_ACTION_TYPES.SET_BOOKING_STATUS:
      return { ...state, bookingStatus: action.payload };

    case FIRE_ACTION_TYPES.SET_TRACKING_DATA:
      return {
        ...state,
        trackingData: { ...state.trackingData, ...action.payload },
      };

    case FIRE_ACTION_TYPES.SET_VEHICLE_POSITION:
      return { ...state, vehiclePosition: action.payload };

    case FIRE_ACTION_TYPES.SET_AI_ANALYSIS:
      return { ...state, aiAnalysis: action.payload };

    case FIRE_ACTION_TYPES.SET_SPREAD_PREDICTION:
      return { ...state, spreadPrediction: action.payload };

    case FIRE_ACTION_TYPES.SET_UNITS_DISPATCHED:
      return { ...state, unitsDispatched: action.payload };

    case FIRE_ACTION_TYPES.SET_ETA:
      return { ...state, eta: action.payload };

    case FIRE_ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload, error: action.payload ? null : state.error };

    case FIRE_ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case FIRE_ACTION_TYPES.CLEAR_BOOKING:
      return {
        ...state,
        booking: null,
        bookingStatus: 'idle',
        trackingData: null,
        vehiclePosition: null,
        eta: null,
        aiAnalysis: null,
        spreadPrediction: null,
        unitsDispatched: [],
        error: null,
      };

    case FIRE_ACTION_TYPES.CLEAR_ALL:
      return initialState;

    default:
      return state;
  }
};

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectFire = (state) => state.fire;
export const selectFireType = (state) => state.fire.fireType;
export const selectFireDetails = (state) => state.fire.fireDetails;
export const selectBuildingInfo = (state) => state.fire.buildingInfo;
export const selectFireVehicleType = (state) => state.fire.vehicleType;
export const selectFireLocation = (state) => state.fire.location;
export const selectFireBooking = (state) => state.fire.booking;
export const selectFireBookingStatus = (state) => state.fire.bookingStatus;
export const selectFireTracking = (state) => state.fire.trackingData;
export const selectFireVehiclePosition = (state) => state.fire.vehiclePosition;
export const selectAIAnalysis = (state) => state.fire.aiAnalysis;
export const selectSpreadPrediction = (state) => state.fire.spreadPrediction;
export const selectUnitsDispatched = (state) => state.fire.unitsDispatched;
export const selectFireETA = (state) => state.fire.eta;
export const selectFireLoading = (state) => state.fire.isLoading;
export const selectFireError = (state) => state.fire.error;

export default fireReducer;