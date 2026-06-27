// db.js — MongoDB connection helper
//
// Uses Mongoose (an ODM — Object Document Mapper) to connect to MongoDB.
// Mongoose lets us define schemas and models instead of writing raw MongoDB queries.
//
// The connection URI comes from the .env file: MONGO_URI=mongodb://localhost:27017/studyhub

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() opens a persistent connection pool to MongoDB.
    // Mongoose will automatically reuse this connection across all models.
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    // If we cannot connect to the database, the app is useless — exit immediately.
    // process.exit(1) signals an error exit code to the OS/process manager.
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
