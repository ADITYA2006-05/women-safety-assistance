const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('\n⚠️  No MONGODB_URI found in environment variables.');
    console.warn('⚠️  Falling back to IN-MEMORY DATABASE. Data will not persist across restarts.\n');
    global.useInMemoryDb = true;
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    isConnected = true;
    global.useInMemoryDb = false;
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn('⚠️  Falling back to IN-MEMORY DATABASE. Data will not persist across restarts.\n');
    global.useInMemoryDb = true;
  }
};

module.exports = connectDB;
