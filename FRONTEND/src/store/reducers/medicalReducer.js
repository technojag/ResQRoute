import { MEDICAL_ACTION_TYPES } from '../actions/medicalActions';

// ─── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  // Booking form data
  emergencyType: null,
  patientDetails: {
    name: '',
    age: '',
    gender: null,
    bloodGroup: null,
    contact: '',
    medicalId: '',
    symptoms: '',
    indicators: [],
  },
  vehicleType: null,
  hospitalPreference: null,   // 'government' | 'private'
  selectedHospital: null,
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
  bookingStatus: 'idle',  // idle | loading | booked | en_route | arrived | completed | cancelled | error

  // Live tracking
  trackingData: null,
  vehiclePosition: null,
  eta: null,

  // UI state
  isLoading: false,
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const medicalReducer = (state = initialState, action) => {
  switch (action.type) {

    case MEDICAL_ACTION_TYPES.SET_EMERGENCY_TYPE:
      return { ...state, emergencyType: action.payload };

    case MEDICAL_ACTION_TYPES.SET_PATIENT_DETAILS:
      return {
        ...state,
        patientDetails: { ...state.patientDetails, ...action.payload },
      };

    case MEDICAL_ACTION_TYPES.SET_VEHICLE_TYPE:
      return { ...state, vehicleType: action.payload };

    case MEDICAL_ACTION_TYPES.SET_HOSPITAL_PREF:
      return {
        ...state,
        hospitalPreference: action.payload,
        selectedHospital: null, // Reset hospital selection when preference changes
      };

    case MEDICAL_ACTION_TYPES.SET_SELECTED_HOSPITAL:
      return { ...state, selectedHospital: action.payload };

    case MEDICAL_ACTION_TYPES.SET_LOCATION:
      return {
        ...state,
        location: { ...state.location, ...action.payload },
      };

    case MEDICAL_ACTION_TYPES.SET_BOOKING:
      return {
        ...state,
        booking: action.payload,
        bookingStatus: 'booked',
        isLoading: false,
      };

    case MEDICAL_ACTION_TYPES.SET_BOOKING_STATUS:
      return { ...state, bookingStatus: action.payload };

    case MEDICAL_ACTION_TYPES.SET_TRACKING_DATA:
      return {
        ...state,
        trackingData: { ...state.trackingData, ...action.payload },
      };

    case MEDICAL_ACTION_TYPES.SET_VEHICLE_POSITION:
      return { ...state, vehiclePosition: action.payload };

    case MEDICAL_ACTION_TYPES.SET_ETA:
      return { ...state, eta: action.payload };

    case MEDICAL_ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload, error: action.payload ? null : state.error };

    case MEDICAL_ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case MEDICAL_ACTION_TYPES.CLEAR_BOOKING:
      return {
        ...state,
        booking: null,
        bookingStatus: 'idle',
        trackingData: null,
        vehiclePosition: null,
        eta: null,
        error: null,
      };

    case MEDICAL_ACTION_TYPES.CLEAR_ALL:
      return initialState;

    default:
      return state;
  }
};

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectMedical = (state) => state.medical;
export const selectEmergencyType = (state) => state.medical.emergencyType;
export const selectPatientDetails = (state) => state.medical.patientDetails;
export const selectVehicleType = (state) => state.medical.vehicleType;
export const selectHospitalPreference = (state) => state.medical.hospitalPreference;
export const selectSelectedHospital = (state) => state.medical.selectedHospital;
export const selectMedicalLocation = (state) => state.medical.location;
export const selectMedicalBooking = (state) => state.medical.booking;
export const selectMedicalBookingStatus = (state) => state.medical.bookingStatus;
export const selectMedicalTracking = (state) => state.medical.trackingData;
export const selectVehiclePosition = (state) => state.medical.vehiclePosition;
export const selectMedicalETA = (state) => state.medical.eta;
export const selectMedicalLoading = (state) => state.medical.isLoading;
export const selectMedicalError = (state) => state.medical.error;

export default medicalReducer;