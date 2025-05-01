const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  items: [{
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  deliveryType: {
    type: String,
    enum: ['emergency', 'standard'],
    required: true
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  tracking: [{
    status: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  prescriptionImages: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient querying
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ pharmacyId: 1, status: 1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

module.exports = mongoose.model('Order', orderSchema); 