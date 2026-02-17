require('dotenv').config();
console.log('\n========== ResQRoute Debug ==========\n');
console.log('Node:', process.version);
console.log('.env JWT_SECRET:', process.env.JWT_SECRET ? '✅ set' : '❌ MISSING');
console.log('.env MONGODB_URI:', process.env.MONGODB_URI ? '✅ set' : '⚠️  not set');

const pkgs = ['express','mongoose','jsonwebtoken','bcryptjs','cors','helmet',
               'express-rate-limit','winston','geolib','socket.io','dotenv','redis'];
console.log('\nPackages:');
let ok = true;
for (const p of pkgs) {
  try { require(p); console.log(' ✅', p); }
  catch(e) { console.log(' ❌', p, '← run: npm install'); ok = false; }
}

console.log('\nApp files:');
const files = [
  ['logger',   './src/utils/logger'],
  ['geoUtils', './src/utils/geoUtils'],
  ['redis',    './src/config/redis'],
  ['firebase', './src/config/firebase'],
  ['errorHandler', './src/api/middlewares/errorHandler'],
  ['authMiddleware','./src/api/middlewares/authMiddleware'],
  ['User model',   './src/models/User'],
  ['authController','./src/api/controllers/authController'],
  ['authRoutes',   './src/api/routes/authRoutes'],
  ['medicalRoutes','./src/api/routes/medicalRoutes'],
  ['fireRoutes',   './src/api/routes/fireRoutes'],
  ['routes/index', './src/api/routes/index'],
  ['app',          './src/app'],
];
let appOk = true;
for (const [name, path] of files) {
  try { require(path); console.log(' ✅', name); }
  catch(e) { console.log(' ❌', name, '→', e.message); appOk = false; }
}

if (!ok) console.log('\n❌ Run:  npm install\n');
else if (!appOk) console.log('\n❌ Fix the errors above, then run:  npm start\n');
else console.log('\n✅ Everything looks good! Run:  npm start\n');