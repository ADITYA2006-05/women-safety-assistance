require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const alertRoutes = require('./routes/alertRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow connections from Next.js local/prod URL
    methods: ['GET', 'POST']
  }
});

// Store io globally for usage in controllers
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());

// Vercel Multi-Project monorepo rewrite support: strip /api/backend prefix if present
app.use((req, res, next) => {
  if (req.url.startsWith('/api/backend')) {
    req.url = req.url.replace('/api/backend', '') || '/';
  }
  next();
});

// Database connection middleware for Serverless compatibility
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    database: global.useInMemoryDb ? 'in-memory-fallback' : 'postgres',
    timestamp: new Date()
  });
});

// Socket.io setup
socketHandler(io);

const PORT = process.env.PORT || 5000;

// Connect DB first, then listen
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Healthcheck available at http://localhost:${PORT}/health`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
