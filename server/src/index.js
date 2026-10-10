const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { PORT, CLIENT_URL } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const contactsRoutes = require('./routes/contacts.routes');
const alertsRoutes = require('./routes/alerts.routes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const tripsRoutes = require('./routes/trips.routes');
const reportsRoutes = require('./routes/reports.routes');
const placesRoutes = require('./routes/places.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/places', placesRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

require('./sockets/locationSocket')(io);
app.set('io', io);

// Basic Route
app.get('/', (req, res) => {
  res.send('SheAlert API is running...');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
