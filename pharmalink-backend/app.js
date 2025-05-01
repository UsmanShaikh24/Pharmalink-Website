const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/users');
const medicineRoutes = require('./routes/medicineRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 