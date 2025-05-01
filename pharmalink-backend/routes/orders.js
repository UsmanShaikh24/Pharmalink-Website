const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const { body, validationResult } = require('express-validator');

// Get all orders (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'userId',
        select: 'name email phoneNumber'
      })
      .populate({
        path: 'pharmacyId',
        select: 'name address'
      })
      .populate({
        path: 'items.medicineId',
        select: 'name price'
      })
      .sort({ createdAt: -1 });

    console.log('Sending orders:', JSON.stringify(orders[0], null, 2));
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post('/', auth, [
  body('items').isArray().notEmpty(),
  body('items.*.medicineId').isMongoId(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('deliveryType').isIn(['emergency', 'standard']),
  body('deliveryAddress').isObject(),
  body('deliveryAddress.street').notEmpty(),
  body('deliveryAddress.city').notEmpty(),
  body('deliveryAddress.state').notEmpty(),
  body('deliveryAddress.zipCode').notEmpty(),
  body('deliveryAddress.coordinates.latitude').isFloat(),
  body('deliveryAddress.coordinates.longitude').isFloat(),
  body('paymentMethod').isIn(['cod'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate medicine availability and calculate total
    let totalAmount = 0;
    const items = [];
    let pharmacyId = null;

    for (const item of req.body.items) {
      const medicine = await Medicine.findById(item.medicineId);
      
      if (!medicine || !medicine.isActive) {
        return res.status(404).json({ error: `Medicine ${item.medicineId} not found or inactive` });
      }

      // Set pharmacyId from first item if not set
      if (!pharmacyId) {
        pharmacyId = medicine.pharmacyId;
      }

      // Validate all items are from same pharmacy
      if (pharmacyId.toString() !== medicine.pharmacyId.toString()) {
        return res.status(400).json({ error: 'All items must be from the same pharmacy' });
      }

      // Validate stock exists and has required fields
      if (!medicine.stock || 
          typeof medicine.stock.currentQuantity !== 'number' || 
          typeof medicine.stock.minThreshold !== 'number' || 
          !medicine.stock.unit) {
        return res.status(400).json({ 
          error: `Invalid stock configuration for medicine ${medicine.name}` 
        });
      }

      // Check if enough stock is available
      if (medicine.stock.currentQuantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for medicine ${medicine.name}. Available: ${medicine.stock.currentQuantity} ${medicine.stock.unit}` 
        });
      }

      totalAmount += medicine.price * item.quantity;
      items.push({
        medicineId: medicine._id,
        quantity: item.quantity,
        price: medicine.price
      });

      // Update stock while preserving the stock object structure
      const updatedStock = {
        currentQuantity: medicine.stock.currentQuantity - item.quantity,
        minThreshold: medicine.stock.minThreshold,
        unit: medicine.stock.unit
      };

      // Update the medicine with the new stock
      await Medicine.findByIdAndUpdate(medicine._id, { 
        $set: { stock: updatedStock }
      }, { 
        new: true,
        runValidators: true 
      });
    }

    // Use the client-provided total amount if available, otherwise use our calculated amount
    const finalTotalAmount = req.body.totalAmount || totalAmount;
    const tax = req.body.tax || 0;
    const deliveryFee = req.body.deliveryFee || 0;

    const order = new Order({
      userId: req.user._id,
      pharmacyId: pharmacyId,
      items,
      totalAmount: finalTotalAmount,
      tax,
      deliveryFee,
      subtotal: totalAmount,
      deliveryType: req.body.deliveryType,
      deliveryAddress: req.body.deliveryAddress,
      paymentMethod: req.body.paymentMethod,
      estimatedDeliveryTime: new Date(Date.now() + (req.body.deliveryType === 'emergency' ? 10 : 60) * 60000)
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's orders
router.get('/user', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('pharmacyId', 'name address')
      .populate('items.medicineId', 'name price');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pharmacy's orders
router.get('/pharmacy', auth, async (req, res) => {
  try {
    const orders = await Order.find({ pharmacyId: req.user._id })
      .populate('userId', 'name address')
      .populate('items.medicineId', 'name price');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('pharmacyId', 'name address')
      .populate('userId', 'name address')
      .populate('items.medicineId', 'name price');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (order.userId.toString() !== req.user._id.toString() && 
        order.pharmacyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin only)
router.patch('/:id/status', adminAuth, [
  body('status').isIn(['confirmed', 'processing', 'out-for-delivery', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = req.body.status;
    
    if (req.body.status === 'delivered') {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = 'completed';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update order tracking
router.patch('/:id/tracking', auth, [
  body('location.latitude').isFloat(),
  body('location.longitude').isFloat(),
  body('status').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is pharmacy owner
    if (order.pharmacyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    order.tracking.push({
      location: req.body.location,
      status: req.body.status
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to cancel
    if (order.userId.toString() !== req.user._id.toString() && 
        order.pharmacyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only allow cancellation if order is not already delivered or cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel this order' });
    }

    // Restore medicine stock
    for (const item of order.items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (medicine) {
        medicine.stock.currentQuantity += item.quantity;
        await medicine.save();
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 