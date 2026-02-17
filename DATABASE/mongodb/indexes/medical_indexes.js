/**
 * MongoDB Indexes for Medical Collections
 * Optimizes query performance for ambulance and hospital searches
 */

// AMBULANCES COLLECTION INDEXES
db.ambulances.createIndex({ "location": "2dsphere" }); // Geo-spatial queries
db.ambulances.createIndex({ "status": 1 }); // Filter by status
db.ambulances.createIndex({ "hospitalId": 1 }); // Group by hospital
db.ambulances.createIndex({ "type": 1, "status": 1 }); // Compound: type + status
db.ambulances.createIndex({ "vehicleNumber": 1 }, { unique: true }); // Unique vehicle
db.ambulances.createIndex({ "driverId": 1 }); // Find by driver
db.ambulances.createIndex({ "currentBookingId": 1 }); // Active bookings

// HOSPITALS COLLECTION INDEXES
db.hospitals.createIndex({ "location": "2dsphere" }); // Geo-spatial queries
db.hospitals.createIndex({ "type": 1 }); // Filter govt/private
db.hospitals.createIndex({ "status": 1 }); // Filter by status
db.hospitals.createIndex({ "type": 1, "status": 1, "location": "2dsphere" }); // Compound
db.hospitals.createIndex({ "specializations": 1 }); // Find by specialization
db.hospitals.createIndex({ "facilities": 1 }); // Find by facilities
db.hospitals.createIndex({ "emergencyCapacity.availableBeds": 1 }); // Bed availability
db.hospitals.createIndex({ "rating": -1 }); // Sort by rating
db.hospitals.createIndex({ "name": "text" }); // Text search
db.hospitals.createIndex({ "governmentSchemes": 1 }); // Filter by schemes

// MEDICAL_BOOKINGS COLLECTION INDEXES
db.medical_bookings.createIndex({ "userId": 1 }); // User's bookings
db.medical_bookings.createIndex({ "status": 1 }); // Filter by status
db.medical_bookings.createIndex({ "assignedAmbulanceId": 1 }); // Ambulance's bookings
db.medical_bookings.createIndex({ "selectedHospitalId": 1 }); // Hospital's bookings
db.medical_bookings.createIndex({ "bookingNumber": 1 }, { unique: true }); // Unique booking
db.medical_bookings.createIndex({ "pickupLocation": "2dsphere" }); // Geo queries
db.medical_bookings.createIndex({ "emergencyType": 1 }); // Filter by emergency
db.medical_bookings.createIndex({ "severity": 1, "status": 1 }); // Priority sorting
db.medical_bookings.createIndex({ "createdAt": -1 }); // Recent bookings
db.medical_bookings.createIndex({ "hospitalPreference": 1 }); // Govt/Private filter
db.medical_bookings.createIndex({ "priority": -1, "createdAt": -1 }); // Queue ordering

console.log("✅ Medical collection indexes created successfully");