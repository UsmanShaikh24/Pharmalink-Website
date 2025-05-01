const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const http = require('http');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://pharmalink-website.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
};

// Initialize Socket.IO with CORS
const io = socketio(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pharmacies', require('./routes/pharmacies'));
const medicineRoutes = require('./routes/medicineRoutes');
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', require('./routes/orders'));

// ✅ Added recommendationRoutes
const recommendationRoutes = require('./routes/recommendationRoutes');
app.use('/api/recommendations', recommendationRoutes);

// ✅ Added userRoutes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
