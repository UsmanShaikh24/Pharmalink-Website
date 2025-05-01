const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const { auth, adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// User registration
router.post('/register/user', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phoneNumber').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = new User(req.body);
    await user.save();
    
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pharmacy registration
router.post('/register/pharmacy', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('licenseNumber').notEmpty(),
  body('contactNumber').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pharmacy = new Pharmacy(req.body);
    await pharmacy.save();
    
    const token = jwt.sign({ _id: pharmacy._id }, process.env.JWT_SECRET);
    res.status(201).json({ pharmacy, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Try to find user first
    let user = await User.findOne({ email });
    
    // If not a user, try to find pharmacy
    if (!user) {
      user = await Pharmacy.findOne({ email });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      console.log('No admin user found with email:', email);
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    console.log('Login successful for admin:', email);
    res.json({ user: { ...user.toObject(), isAdmin: true }, token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router; 