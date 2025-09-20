import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

// Import routes
import authRoutes from './routes/auth.js';
import emergencyRoutes from './routes/emergency.js';
import userRoutes from './routes/users.js';
import hospitalRoutes from './routes/hospitals.js';
import volunteerRoutes from './routes/volunteers.js';
import aiRoutes from './routes/ai.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { connectDB } from './config/database.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/emergency.log' })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  logger.info('User connected:', socket.id);

  socket.on('join_emergency_room', (emergencyId) => {
    socket.join(`emergency_${emergencyId}`);
    logger.info(`Socket ${socket.id} joined emergency room: ${emergencyId}`);
  });

  socket.on('location_update', (data) => {
    socket.broadcast.emit('user_location_update', data);
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected:', socket.id);
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Emergency Detection Server running on port ${PORT}`);
});

export { io, logger };