const mongoose = require('mongoose');

const fireBookingSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    unique: true,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  incidentType: {
    type: String,
    enum: [
      'building_fire',
      'vehicle_fire',
      'forest_fire',
      'chemical_fire',
      'electrical_fire',
      'industrial_fire',
      'gas_leak',
      'explosion',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'catastrophic'],
    required: true
  },
  incidentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      street: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  buildingDetails: {
    type: String,
    floors: Number,
    occupants: Number,
    buildingMaterial: String,
    hasBasement: Boolean,
    hasElevator: Boolean
  },
  fireDetails: {
    source: String,
    spreadRate: String,
    affectedArea: Number,
    casualties: {
      injured: Number,
      trapped: Number,
      deceased: Number
    },
    hazardousMaterials: [String],
    nearbyRisks: [String]
  },
  assignedStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FireStation'
  },
  assignedTrucks: [{
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FireTruck'
    },
    assignedAt: Date,
    arrivedAt: Date,
    role: String
  }],
  status: {
    type: String,
    enum: [
      'reported',
      'dispatched',
      'enroute',
      'on_scene',
      'controlled',
      'extinguished',
      'completed',
      'cancelled'
    ],
    default: 'reported'
  },
  timeline: [{
    status: String,
    timestamp: Date,
    location: [Number],
    note: String
  }],
  estimatedArrivalTime: Number,
  dispatchedAt: Date,
  arrivedAt: Date,
  controlledAt: Date,
  extinguishedAt: Date,
  completedAt: Date,
  responseTime: Number,
  operationDuration: Number,
  resourcesUsed: {
    waterUsed: Number,
    foamUsed: Number,
    personnelDeployed: Number
  },
  damageAssessment: {
    propertyDamage: String,
    estimatedLoss: Number,
    causeOfFire: String
  },
  linkedEmergencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalBooking'
  }],
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  greenCorridorActivated: Boolean
}, {
  timestamps: true
});

fireBookingSchema.index({ incidentId: 1 });
fireBookingSchema.index({ reportedBy: 1, createdAt: -1 });
fireBookingSchema.index({ status: 1 });
fireBookingSchema.index({ incidentLocation: '2dsphere' });

fireBookingSchema.pre('save', async function(next) {
  if (!this.incidentId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.incidentId = `FB${timestamp}${random}`;
  }
  next();
});

fireBookingSchema.methods.addTimelineEntry = async function(status, note = '', location = null) {
  this.timeline.push({
    status,
    timestamp: new Date(),
    location,
    note
  });
  return await this.save();
};

fireBookingSchema.methods.updateStatus = async function(status, note = '') {
  this.status = status;
  
  const now = new Date();
  switch(status) {
    case 'dispatched':
      this.dispatchedAt = now;
      break;
    case 'on_scene':
      this.arrivedAt = now;
      if (this.dispatchedAt) {
        this.responseTime = Math.round((now - this.dispatchedAt) / 1000 / 60);
      }
      break;
    case 'controlled':
      this.controlledAt = now;
      break;
    case 'extinguished':
      this.extinguishedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      if (this.arrivedAt) {
        this.operationDuration = Math.round((now - this.arrivedAt) / 1000 / 60);
      }
      break;
  }
  
  await this.addTimelineEntry(status, note);
  return await this.save();
};

const FireBooking = mongoose.model('FireBooking', fireBookingSchema);

module.exports = FireBooking;