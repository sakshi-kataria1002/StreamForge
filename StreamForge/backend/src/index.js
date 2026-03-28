require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

const { setupSocket } = require('./socket');

const authRoutes = require('./routes/auth.routes');
const commentRoutes = require('./routes/comment.routes');
const videoRoutes = require('./routes/video.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const historyRoutes = require('./routes/history.routes');
const savedRoutes = require('./routes/saved.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const moderationRoutes = require('./routes/moderation.routes');
const membershipRoutes = require('./routes/membership.routes');
const livestreamRoutes = require('./routes/livestream.routes');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/videos/:videoId/comments', commentRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1', subscriptionRoutes);
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/saved', savedRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/livestreams', livestreamRoutes);

// Health check
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, error: { message: 'Route not found' } }));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/streamforge', { family: 4 })
  .then(() => {
    console.log('MongoDB connected');
    const server = http.createServer(app);
    setupSocket(server);
    server.listen(PORT, () => console.log(`StreamForge API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
