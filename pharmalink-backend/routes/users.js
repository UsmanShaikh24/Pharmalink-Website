const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (without address)
router.patch('/profile', [
  auth,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('Invalid email format'),
  body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phoneNumber } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a new address
router.post('/addresses', [
  auth,
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('type').isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
  body('isDefault').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAddress = req.body;
    if (newAddress.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    } else if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an address
router.patch('/addresses/:addressId', [
  auth,
  body('fullName').optional().trim().notEmpty(),
  body('phoneNumber').optional().trim().notEmpty(),
  body('street').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim().notEmpty(),
  body('zipCode').optional().trim().notEmpty(),
  body('type').optional().isIn(['home', 'work', 'other']),
  body('isDefault').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    Object.assign(address, req.body);

    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== req.params.addressId) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an address
router.delete('/addresses/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Set default address
router.patch('/addresses/:addressId/set-default', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.addressId;
    });

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.patch('/change-password', [
  auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 