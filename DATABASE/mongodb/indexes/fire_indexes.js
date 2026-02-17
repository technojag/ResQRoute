/**
 * MongoDB Indexes for Fire Collections
 * Optimizes query performance for fire truck and incident searches
 */

// FIRETRUCKS COLLECTION INDEXES
db.firetrucks.createIndex({ "location": "2dsphere" }); // Geo-spatial queries
db.firetrucks.createIndex({ "status": 1 }); // Filter by status
db.firetrucks.createIndex({ "stationId": 1 }); // Group by station
db.firetrucks.createIndex({ "type": 1, "status": 1 }); // Compound: type + status
db.firetrucks.createIndex({ "vehicleNumber": 1 }, { unique: true }); // Unique vehicle
db.firetrucks.createIndex({ "captain.userId": 1 }); // Find by captain
db.firetrucks.createIndex({ "currentBookingId": 1 }); // Active incidents
db.firetrucks.createIndex({ "equipment.waterCapacity": -1 }); // Sort by capacity

// FIRESTATIONS COLLECTION INDEXES (if you create this collection later)
db.firestations.createIndex({ "location": "2dsphere" }); // Geo-spatial queries
db.firestations.createIndex({ "status": 1 }); // Filter by status
db.firestations.createIndex({ "name": "text" }); // Text search

// FIRE_BOOKINGS COLLECTION INDEXES
db.fire_bookings.createIndex({ "userId": 1 }); // User's reports
db.fire_bookings.createIndex({ "status": 1 }); // Filter by status
db.fire_bookings.createIndex({ "assignedFireTrucks.truckId": 1 }); // Truck's incidents
db.fire_bookings.createIndex({ "bookingNumber": 1 }, { unique: true }); // Unique booking
db.fire_bookings.createIndex({ "location": "2dsphere" }); // Geo queries
db.fire_bookings.createIndex({ "fireType": 1 }); // Filter by type
db.fire_bookings.createIndex({ "severity": 1, "status": 1 }); // Priority sorting
db.fire_bookings.createIndex({ "createdAt": -1 }); // Recent incidents
db.fire_bookings.createIndex({ "priority": -1, "createdAt": -1 }); // Queue ordering
db.fire_bookings.createIndex({ "buildingInfo.type": 1 }); // Building type filter

console.log("✅ Fire collection indexes created successfully");