// ─── store/store.js ───────────────────────────────────────────────────────────
import { createStore, combineReducers, applyMiddleware } from 'redux';

const MEDICAL_ACTIONS = {
  SET_BOOKING: 'medical/SET_BOOKING',
  SET_TRACKING: 'medical/SET_TRACKING',
  CLEAR: 'medical/CLEAR',
};

const FIRE_ACTIONS = {
  SET_BOOKING: 'fire/SET_BOOKING',
  SET_TRACKING: 'fire/SET_TRACKING',
  CLEAR: 'fire/CLEAR',
};

// ─── Medical Reducer ──────────────────────────────────────────────────────────
const medicalInitial = {
  booking: null,
  tracking: null,
  status: 'idle',
};

export const medicalReducer = (state = medicalInitial, action) => {
  switch (action.type) {
    case MEDICAL_ACTIONS.SET_BOOKING:
      return { ...state, booking: action.payload, status: 'booked' };
    case MEDICAL_ACTIONS.SET_TRACKING:
      return { ...state, tracking: action.payload };
    case MEDICAL_ACTIONS.CLEAR:
      return medicalInitial;
    default:
      return state;
  }
};

// ─── Fire Reducer ─────────────────────────────────────────────────────────────
const fireInitial = {
  booking: null,
  tracking: null,
  status: 'idle',
};

export const fireReducer = (state = fireInitial, action) => {
  switch (action.type) {
    case FIRE_ACTIONS.SET_BOOKING:
      return { ...state, booking: action.payload, status: 'booked' };
    case FIRE_ACTIONS.SET_TRACKING:
      return { ...state, tracking: action.payload };
    case FIRE_ACTIONS.CLEAR:
      return fireInitial;
    default:
      return state;
  }
};

// ─── Actions ──────────────────────────────────────────────────────────────────
export const medicalActions = {
  setBooking: (data) => ({ type: MEDICAL_ACTIONS.SET_BOOKING, payload: data }),
  setTracking: (data) => ({ type: MEDICAL_ACTIONS.SET_TRACKING, payload: data }),
  clear: () => ({ type: MEDICAL_ACTIONS.CLEAR }),
};

export const fireActions = {
  setBooking: (data) => ({ type: FIRE_ACTIONS.SET_BOOKING, payload: data }),
  setTracking: (data) => ({ type: FIRE_ACTIONS.SET_TRACKING, payload: data }),
  clear: () => ({ type: FIRE_ACTIONS.CLEAR }),
};

// ─── Store ────────────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  medical: medicalReducer,
  fire: fireReducer,
});

const store = createStore(rootReducer);
export default store;