const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let uri = MONGO_URI;
    
    try {
      console.log('Attempting to connect to standard MongoDB...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (e) {
      console.log('Local MongoDB not found. Spinning up an in-memory database for testing...');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log(`In-Memory MongoDB Connected!`);
      console.log('Note: Data will be lost when the server stops. This is for testing only.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
