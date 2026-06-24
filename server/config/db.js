const mongoose = require('mongoose');

const connectDB = async () => {
  const db = mongoose.connection;

  db.on('connecting', () => {
    console.log('🔄 Connecting to MongoDB database...');
  });

  db.on('connected', () => {
    console.log('✅ MongoDB connection established successfully.');
  });

  db.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });

  db.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
  });

  db.on('reconnected', () => {
    console.log('💚 MongoDB connection restored successfully.');
  });

  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finbuddy';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error(`❌ MongoDB initial connection failed: ${error.message}`);
    console.warn('⚠️ Running server in offline-simulation mode.');
  }
};

module.exports = connectDB;
