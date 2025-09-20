import mongoose from 'mongoose';
import { logger } from '../server.js';

export const connectDB = async () => {
  try {
    // For demo purposes, we'll use a simulated MongoDB connection
    // In production, use: process.env.MONGODB_URI
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    // For demo purposes, we'll continue without MongoDB
    // In production, you should exit the process
    console.log('Running in demo mode without MongoDB connection');
  }
};