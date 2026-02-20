const geolib = require('geolib');

const calculateDistance = (point1, point2) => {
  return geolib.getDistance(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  );
};

const isPointInRadius = (point, center, radius) => {
  const distance = calculateDistance(point, center);
  return distance <= radius;
};

const calculateBearing = (point1, point2) => {
  return geolib.getRhumbLineBearing(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  );
};

module.exports = {
  calculateDistance,
  isPointInRadius,
  calculateBearing
};