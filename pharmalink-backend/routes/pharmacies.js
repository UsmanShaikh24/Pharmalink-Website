const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Pharmacy = require('../models/Pharmacy');
const { body, validationResult } = require('express-validator');

// Create pharmacy (admin only)
router.post('/', adminAuth, [
  body('name').trim().notEmpty().withMessage('Pharmacy name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  body('address').isObject().withMessage('Address is required'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pinCode').trim().notEmpty().withMessage('PIN code is required'),
  body('operatingHours').isObject().withMessage('Operating hours are required'),
  body('operatingHours.open').notEmpty().withMessage('Opening time is required'),
  body('operatingHours.close').notEmpty().withMessage('Closing time is required'),
  body('deliveryRadius').isNumeric().withMessage('Delivery radius must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      licenseNumber,
      contactNumber,
      address,
      operatingHours,
      deliveryRadius
    } = req.body;

    // Check if pharmacy with same email or license exists
    const existingPharmacy = await Pharmacy.findOne({
      $or: [
        { email: email.toLowerCase() },
        { licenseNumber }
      ]
    });

    if (existingPharmacy) {
      return res.status(400).json({
        error: existingPharmacy.email === email.toLowerCase()
          ? 'Email already registered'
          : 'License number already registered'
      });
    }

    const pharmacy = new Pharmacy({
      name,
      email: email.toLowerCase(),
      licenseNumber,
      contactNumber,
      address,
      operatingHours,
      deliveryRadius,
      isActive: true,
      isVerified: true, // Auto-verify when created by admin
      role: 'pharmacy'
    });

    await pharmacy.save();
    res.status(201).json(pharmacy);
  } catch (error) {
    console.error('Error creating pharmacy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all pharmacies
router.get('/', async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ isActive: true });
    res.json(pharmacies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby pharmacies
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const pharmacies = await Pharmacy.find({
      isActive: true,
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    });

    res.json(pharmacies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single pharmacy
router.get('/:id', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }
    res.json(pharmacy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update pharmacy (only by pharmacy owner or admin)
router.patch('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('contactNumber').optional().notEmpty(),
  body('address').optional().isObject(),
  body('operatingHours').optional().isObject(),
  body('deliveryRadius').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    // Check if user is pharmacy owner or admin
    if (req.user._id.toString() !== pharmacy._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = Object.keys(req.body);
    updates.forEach(update => pharmacy[update] = req.body[update]);
    await pharmacy.save();

    res.json(pharmacy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify pharmacy (admin only)
router.patch('/:id/verify', adminAuth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    pharmacy.isVerified = true;
    await pharmacy.save();

    res.json(pharmacy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deactivate pharmacy (admin only)
router.patch('/:id/deactivate', adminAuth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    pharmacy.isActive = false;
    await pharmacy.save();

    res.json(pharmacy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pharmacy reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id)
      .select('reviews')
      .populate('reviews.userId', 'name');
    
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    res.json(pharmacy.reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add pharmacy review
router.post('/:id/reviews', auth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    const review = {
      userId: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    };

    pharmacy.reviews.push(review);
    
    // Update average rating
    const totalRating = pharmacy.reviews.reduce((sum, review) => sum + review.rating, 0);
    pharmacy.rating = totalRating / pharmacy.reviews.length;
    
    await pharmacy.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete pharmacy (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    await Pharmacy.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pharmacy deleted successfully' });
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update pharmacy (admin only)
router.put('/:id', adminAuth, [
  body('name').optional().trim().notEmpty().withMessage('Pharmacy name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('licenseNumber').optional().trim().notEmpty().withMessage('License number cannot be empty'),
  body('contactNumber').optional().trim().notEmpty().withMessage('Contact number cannot be empty'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('operatingHours').optional().isObject().withMessage('Operating hours must be an object'),
  body('deliveryRadius').optional().isNumeric().withMessage('Delivery radius must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    // Check email uniqueness if being updated
    if (req.body.email && req.body.email.toLowerCase() !== pharmacy.email) {
      const existingPharmacy = await Pharmacy.findOne({ email: req.body.email.toLowerCase() });
      if (existingPharmacy) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Check license number uniqueness if being updated
    if (req.body.licenseNumber && req.body.licenseNumber !== pharmacy.licenseNumber) {
      const existingPharmacy = await Pharmacy.findOne({ licenseNumber: req.body.licenseNumber });
      if (existingPharmacy) {
        return res.status(400).json({ error: 'License number already registered' });
      }
    }

    const updates = Object.keys(req.body);
    updates.forEach(update => pharmacy[update] = req.body[update]);
    
    await pharmacy.save();
    res.json(pharmacy);
  } catch (error) {
    console.error('Error updating pharmacy:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 