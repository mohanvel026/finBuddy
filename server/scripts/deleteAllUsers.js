// server/scripts/deleteAllUsers.js
// Run this script to delete ALL users and their associated data from MongoDB
// Usage: node server/scripts/deleteAllUsers.js
// ⚠️  WARNING: This is IRREVERSIBLE. All user data will be permanently deleted.

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ No MONGODB_URI found in .env');
  process.exit(1);
}

const deleteAllData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.\n');

    const db = mongoose.connection.db;

    // Count everything first
    const userCount    = await db.collection('users').countDocuments();
    const groupCount   = await db.collection('groups').countDocuments();
    const expenseCount = await db.collection('expenses').countDocuments();
    const tradeCount   = await db.collection('trades').countDocuments();
    const notifCount   = await db.collection('notifications').countDocuments();

    console.log('📊 Current database state:');
    console.log(`   👤 Users:         ${userCount}`);
    console.log(`   👥 Groups:        ${groupCount}`);
    console.log(`   💸 Expenses:      ${expenseCount}`);
    console.log(`   📈 Trades:        ${tradeCount}`);
    console.log(`   🔔 Notifications: ${notifCount}`);
    console.log('');

    if (userCount === 0) {
      console.log('ℹ️  No users to delete. Database is already clean.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🗑️  Deleting all users and associated data...');

    // Delete all collections related to users
    const collections = [
      'users', 'groups', 'expenses', 'trades', 'portfolios',
      'notifications', 'watchlists', 'sessions', 'refreshtokens',
      'activities', 'battles', 'trips', 'photovaults'
    ];

    for (const col of collections) {
      try {
        const result = await db.collection(col).deleteMany({});
        if (result.deletedCount > 0) {
          console.log(`   ✅ Deleted ${result.deletedCount} documents from '${col}'`);
        }
      } catch (e) {
        // Collection might not exist — skip
      }
    }

    console.log('\n✅ All user data deleted successfully.');
    console.log('🎯 The database is now clean. Users can register fresh.');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

deleteAllData();
