const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    deliveryOption,
    deliveryAddress,
    subtotal,
    tax,
    deliveryFee,
    total
  } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items in order');
  }

  // Get the first item's pharmacyId (assuming all items are from the same pharmacy)
  const firstMedicine = await Medicine.findById(items[0].medicineId);
  if (!firstMedicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  // Verify all items are from the same pharmacy
  const pharmacyId = firstMedicine.pharmacyId;
  for (const item of items) {
    const medicine = await Medicine.findById(item.medicineId);
    if (!medicine) {
      res.status(404);
      throw new Error(`Medicine with ID ${item.medicineId} not found`);
    }
    if (!medicine.pharmacyId.equals(pharmacyId)) {
      res.status(400);
      throw new Error('All items must be from the same pharmacy');
    }

    // Check stock availability
    if (medicine.stock.currentQuantity < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${medicine.name}`);
    }
  }

  // Create order
  const order = await Order.create({
    userId: req.user._id,
    pharmacyId,
    items: items.map(item => ({
      medicineId: item.medicineId,
      quantity: item.quantity,
      price: item.price
    })),
    totalAmount: total,
    deliveryType: deliveryOption,
    deliveryAddress: {
      ...deliveryAddress,
      coordinates: deliveryAddress.coordinates || {}
    },
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    estimatedDeliveryTime: calculateEstimatedDeliveryTime(deliveryOption)
  });

  // Update medicine stock
  for (const item of items) {
    await Medicine.findByIdAndUpdate(
      item.medicineId,
      { $inc: { 'stock.currentQuantity': -item.quantity } }
    );
  }

  // Add order to user's orders
  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { orders: order._id } }
  );

  res.status(201).json(order);
});

// @desc    Get all orders for the authenticated user
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id })
    .populate('items.medicineId', 'name manufacturer price')
    .populate('pharmacyId', 'name address contactNumber')
    .sort('-createdAt');

  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.medicineId', 'name manufacturer price')
    .populate('pharmacyId', 'name address contactNumber');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the authenticated user
  if (!order.userId.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this order');
  }

  res.json(order);
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only allow pharmacy or admin to update status
  if (!req.user.isAdmin && !order.pharmacyId.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  order.status = status;
  if (status === 'delivered') {
    order.actualDeliveryTime = new Date();
    order.paymentStatus = 'completed';
  }

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// Helper function to calculate estimated delivery time
const calculateEstimatedDeliveryTime = (deliveryType) => {
  const now = new Date();
  if (deliveryType === 'emergency') {
    return new Date(now.getTime() + 10 * 60000); // 10 minutes
  }
  return new Date(now.getTime() + 45 * 60000); // 45 minutes
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
}; 