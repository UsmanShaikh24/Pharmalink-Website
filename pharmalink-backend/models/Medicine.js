const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  dosageForm: {
    type: String,
    required: true,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Other']
  },
  strength: {
    value: Number,
    unit: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    currentQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    unit: {
      type: String,
      required: true,
      enum: ['Strips', 'Bottles', 'Units', 'Boxes']
    }
  },
  expiryDate: {
    type: Date,
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });

// Add a compound index for pharmacyId and batchNumber
medicineSchema.index({ pharmacyId: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model('Medicine', medicineSchema); 