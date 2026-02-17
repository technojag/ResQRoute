const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB Connection
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'resqroute';

// Color codes for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    log('\n🚀 Starting database seeding process...', 'blue');
    
    // Connect to MongoDB
    await client.connect();
    log('✅ Connected to MongoDB', 'green');
    
    const db = client.db(DB_NAME);
    
    // Drop existing collections (fresh start)
    log('\n🗑️  Clearing existing data...', 'yellow');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      log(`   Dropped: ${collection.name}`, 'yellow');
    }
    
    // 1. Import Government Hospitals
    log('\n📥 Importing Government Hospitals...', 'blue');
    const govHospitals = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mongodb/seeds/medical/hospitals_government.json'), 'utf8')
    );
    await db.collection('hospitals').insertMany(govHospitals);
    log(`✅ Imported ${govHospitals.length} government hospitals`, 'green');
    
    // 2. Import Private Hospitals
    log('\n📥 Importing Private Hospitals...', 'blue');
    const pvtHospitals = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mongodb/seeds/medical/hospitals_private.json'), 'utf8')
    );
    await db.collection('hospitals').insertMany(pvtHospitals);
    log(`✅ Imported ${pvtHospitals.length} private hospitals`, 'green');
    
    // 3. Import Ambulances
    log('\n📥 Importing Ambulances...', 'blue');
    const ambulances = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mongodb/seeds/medical/ambulances.json'), 'utf8')
    );
    await db.collection('ambulances').insertMany(ambulances);
    log(`✅ Imported ${ambulances.length} ambulances`, 'green');
    
    // 4. Import Fire Stations
    log('\n📥 Importing Fire Stations...', 'blue');
    const firestations = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mongodb/seeds/fire/firestations.json'), 'utf8')
    );
    await db.collection('firestations').insertMany(firestations);
    log(`✅ Imported ${firestations.length} fire stations`, 'green');
    
    // 5. Import Fire Trucks
    log('\n📥 Importing Fire Trucks...', 'blue');
    const firetrucks = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mongodb/seeds/fire/firetrucks.json'), 'utf8')
    );
    await db.collection('firetrucks').insertMany(firetrucks);
    log(`✅ Imported ${firetrucks.length} fire trucks`, 'green');
    
    // 6. Create Indexes
    log('\n🔧 Creating indexes...', 'blue');
    await createIndexes(db);
    
    // 7. Display Summary
    log('\n' + '='.repeat(50), 'green');
    log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(50), 'green');
    
    log('\n📊 SUMMARY:', 'blue');
    log(`   Government Hospitals: ${govHospitals.length}`, 'green');
    log(`   Private Hospitals: ${pvtHospitals.length}`, 'green');
    log(`   Total Hospitals: ${govHospitals.length + pvtHospitals.length}`, 'green');
    log(`   Ambulances: ${ambulances.length}`, 'green');
    log(`   Fire Stations: ${firestations.length}`, 'green');
    log(`   Fire Trucks: ${firetrucks.length}`, 'green');
    
    log('\n🔍 Verify data:', 'blue');
    log('   mongosh', 'yellow');
    log('   use resqroute', 'yellow');
    log('   db.hospitals.countDocuments()', 'yellow');
    
  } catch (error) {
    log('\n❌ ERROR SEEDING DATABASE:', 'red');
    console.error(error);
  } finally {
    await client.close();
    log('\n👋 Disconnected from MongoDB\n', 'blue');
  }
}

async function createIndexes(db) {
  // Ambulances Indexes
  await db.collection('ambulances').createIndex({ location: '2dsphere' });
  await db.collection('ambulances').createIndex({ status: 1 });
  await db.collection('ambulances').createIndex({ vehicleNumber: 1 }, { unique: true });
  await db.collection('ambulances').createIndex({ hospitalId: 1 });
  log('   ✅ Ambulances indexes created', 'green');
  
  // Hospitals Indexes
  await db.collection('hospitals').createIndex({ location: '2dsphere' });
  await db.collection('hospitals').createIndex({ type: 1 });
  await db.collection('hospitals').createIndex({ status: 1 });
  await db.collection('hospitals').createIndex({ 'emergencyCapacity.availableBeds': 1 });
  log('   ✅ Hospitals indexes created', 'green');
  
  // Fire Trucks Indexes
  await db.collection('firetrucks').createIndex({ location: '2dsphere' });
  await db.collection('firetrucks').createIndex({ status: 1 });
  await db.collection('firetrucks').createIndex({ vehicleNumber: 1 }, { unique: true });
  log('   ✅ Fire Trucks indexes created', 'green');
  
  // Fire Stations Indexes
  await db.collection('firestations').createIndex({ location: '2dsphere' });
  await db.collection('firestations').createIndex({ status: 1 });
  log('   ✅ Fire Stations indexes created', 'green');
}

// Run the seeding
seedDatabase();