const geolib = require('geolib');

/**
 * Calculate distance between two coordinates in meters
 * @param {Object} point1 - {latitude, longitude}
 * @param {Object} point2 - {latitude, longitude}
 * @returns {number} Distance in meters
 */
const calculateDistance = (point1, point2) => {
  try {
    const distance = geolib.getDistance(
      { latitude: point1.latitude, longitude: point1.longitude },
      { latitude: point2.latitude, longitude: point2.longitude }
    );
    return distance;
  } catch (error) {
    throw new Error('Error calculating distance: ' + error.message);
  }
};

/**
 * Calculate distance in kilometers
 * @param {Object} point1 
 * @param {Object} point2 
 * @returns {number} Distance in kilometers
 */
const calculateDistanceInKm = (point1, point2) => {
  const distanceInMeters = calculateDistance(point1, point2);
  return distanceInMeters / 1000;
};

/**
 * Find nearest location from a list
 * @param {Object} origin - {latitude, longitude}
 * @param {Array} locations - Array of locations with latitude/longitude
 * @returns {Object} Nearest location with distance
 */
const findNearest = (origin, locations) => {
  if (!locations || locations.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  locations.forEach(location => {
    const distance = calculateDistance(origin, {
      latitude: location.latitude,
      longitude: location.longitude
    });

    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        ...location,
        distance: distance,
        distanceInKm: distance / 1000
      };
    }
  });

  return nearest;
};

/**
 * Get locations within a radius
 * @param {Object} center - {latitude, longitude}
 * @param {Array} locations - Array of locations
 * @param {number} radiusInMeters - Radius in meters
 * @returns {Array} Locations within radius
 */
const getLocationsWithinRadius = (center, locations, radiusInMeters) => {
  return locations.filter(location => {
    const distance = calculateDistance(center, {
      latitude: location.latitude,
      longitude: location.longitude
    });
    return distance <= radiusInMeters;
  }).map(location => ({
    ...location,
    distance: calculateDistance(center, {
      latitude: location.latitude,
      longitude: location.longitude
    }),
    distanceInKm: calculateDistance(center, {
      latitude: location.latitude,
      longitude: location.longitude
    }) / 1000
  }));
};

/**
 * Calculate ETA based on distance and speed
 * @param {number} distanceInMeters 
 * @param {number} averageSpeedKmh - Average speed in km/h
 * @returns {Object} ETA details
 */
const calculateETA = (distanceInMeters, averageSpeedKmh = 40) => {
  const distanceInKm = distanceInMeters / 1000;
  const timeInHours = distanceInKm / averageSpeedKmh;
  const timeInMinutes = Math.ceil(timeInHours * 60);

  return {
    distanceInKm: parseFloat(distanceInKm.toFixed(2)),
    distanceInMeters: distanceInMeters,
    estimatedMinutes: timeInMinutes,
    estimatedTime: `${timeInMinutes} min`,
    estimatedArrival: new Date(Date.now() + timeInMinutes * 60 * 1000)
  };
};

/**
 * Calculate bearing between two points
 * @param {Object} point1 
 * @param {Object} point2 
 * @returns {number} Bearing in degrees
 */
const calculateBearing = (point1, point2) => {
  return geolib.getGreatCircleBearing(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  );
};

/**
 * Check if a point is within a polygon
 * @param {Object} point - {latitude, longitude}
 * @param {Array} polygon - Array of points defining polygon
 * @returns {boolean}
 */
const isPointInPolygon = (point, polygon) => {
  return geolib.isPointInPolygon(
    { latitude: point.latitude, longitude: point.longitude },
    polygon.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
  );
};

/**
 * Get center point of multiple locations
 * @param {Array} locations 
 * @returns {Object} Center point
 */
const getCenterPoint = (locations) => {
  const center = geolib.getCenter(
    locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude
    }))
  );
  
  return {
    latitude: center.latitude,
    longitude: center.longitude
  };
};

/**
 * Calculate optimal route through multiple points
 * @param {Object} start - Starting point
 * @param {Array} waypoints - Array of waypoints
 * @param {Object} end - End point
 * @returns {Array} Ordered route
 */
const calculateOptimalRoute = (start, waypoints, end) => {
  // Simple nearest neighbor algorithm
  const route = [start];
  const remaining = [...waypoints];
  let current = start;

  while (remaining.length > 0) {
    const nearest = findNearest(current, remaining);
    route.push(nearest);
    current = nearest;
    remaining.splice(remaining.indexOf(waypoints.find(w => 
      w.latitude === nearest.latitude && w.longitude === nearest.longitude
    )), 1);
  }

  if (end) {
    route.push(end);
  }

  return route;
};

/**
 * Convert coordinates to GeoJSON format
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Object} GeoJSON point
 */
const toGeoJSON = (latitude, longitude) => {
  return {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
};

/**
 * Parse GeoJSON to coordinates
 * @param {Object} geoJSON 
 * @returns {Object} {latitude, longitude}
 */
const fromGeoJSON = (geoJSON) => {
  if (geoJSON.type !== 'Point') {
    throw new Error('Only Point GeoJSON is supported');
  }
  return {
    latitude: geoJSON.coordinates[1],
    longitude: geoJSON.coordinates[0]
  };
};

module.exports = {
  calculateDistance,
  calculateDistanceInKm,
  findNearest,
  getLocationsWithinRadius,
  calculateETA,
  calculateBearing,
  isPointInPolygon,
  getCenterPoint,
  calculateOptimalRoute,
  toGeoJSON,
  fromGeoJSON
};