require('dotenv').config();
const files = [
  ['dotenv',         () => require('dotenv')],
  ['express',        () => require('express')],
  ['mongoose',       () => require('mongoose')],
  ['jsonwebtoken',   () => require('jsonwebtoken')],
  ['bcryptjs',       () => require('bcryptjs')],
  ['cors',           () => require('cors')],
  ['helmet',         () => require('helmet')],
  ['winston',        () => require('winston')],
  ['geolib',         () => require('geolib')],
  ['socket.io',      () => require('socket.io')],
  ['redis',          () => require('redis')],
  ['logger',         () => require('./src/utils/logger')],
  ['geoUtils',       () => require('./src/utils/geoUtils')],
  ['redis config',   () => require('./src/config/redis')],
  ['firebase',       () => require('./src/config/firebase')],
  ['User',           () => require('./src/models/User')],
  ['Hospital',       () => require('./src/models/medical/Hospital')],
  ['Ambulance',      () => require('./src/models/medical/Ambulance')],
  ['MedicalBooking', () => require('./src/models/medical/MedicalBooking')],
  ['FireStation',    () => require('./src/models/fire/FireStation')],
  ['FireTruck',      () => require('./src/models/fire/FireTruck')],
  ['FireBooking',    () => require('./src/models/fire/FireBooking')],
  ['errorHandler',   () => require('./src/api/middlewares/errorHandler')],
  ['authMiddleware', () => require('./src/api/middlewares/authMiddleware')],
  ['authController', () => require('./src/api/controllers/authController')],
  ['medicalBookingCtrl', () => require('./src/api/controllers/medical/medicalBookingController')],
  ['hospitalCtrl',   () => require('./src/api/controllers/medical/hospitalController')],
  ['ambulanceCtrl',  () => require('./src/api/controllers/medical/ambulanceController')],
  ['fireBookingCtrl',() => require('./src/api/controllers/fire/fireBookingController')],
  ['authRoutes',     () => require('./src/api/routes/authRoutes')],
  ['medicalRoutes',  () => require('./src/api/routes/medicalRoutes')],
  ['fireRoutes',     () => require('./src/api/routes/fireRoutes')],
  ['routes/index',   () => require('./src/api/routes/index')],
  ['app',            () => require('./src/app')],
];

let hasError = false;
for (const [name, load] of files) {
  try {
    load();
    console.log('  ✅', name);
  } catch(e) {
    console.log('  ❌', name, '→', e.message.split('\n')[0]);
    hasError = true;
  }
}

if (hasError) {
  console.log('\n❌ Fix the errors above, then run: npm start\n');
} else {
  console.log('\n✅ ALL OK - run: npm start\n');
}