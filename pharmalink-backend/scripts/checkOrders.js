require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');

async function checkOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all orders
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('pharmacyId', 'name')
      .populate('items.medicineId', 'name price');

    console.log(`Found ${orders.length} orders`);
    
    // Output detailed info for each order
    orders.forEach((order, index) => {
      console.log(`\n========== Order ${index + 1} ==========`);
      console.log(`ID: ${order._id}`);
      console.log(`User: ${order.userId ? order.userId.name : 'N/A'}`);
      console.log(`Pharmacy: ${order.pharmacyId ? order.pharmacyId.name : 'N/A'}`);
      console.log(`Status: ${order.status}`);
      console.log(`Total Amount: ${order.totalAmount}`);
      console.log('Items:');
      
      order.items.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.medicineId ? item.medicineId.name : 'Unknown Medicine'}`);
        console.log(`     - Quantity: ${item.quantity}`);
        console.log(`     - Price stored in order: ${item.price}`);
        console.log(`     - Current medicine price: ${item.medicineId ? item.medicineId.price : 'N/A'}`);
        console.log(`     - Total for item: ${item.price * item.quantity}`);
      });
    });

    console.log('\nCheck complete');

    // Also check if the referenced user and pharmacy exist
    console.log('\nChecking Users:');
    const users = await User.find();
    console.log(`Found ${users.length} users:`, users.map(u => ({ id: u._id, name: u.name, role: u.role })));

    console.log('\nChecking Pharmacies:');
    const pharmacies = await Pharmacy.find();
    console.log(`Found ${pharmacies.length} pharmacies:`, pharmacies.map(p => ({ id: p._id, name: p.name })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkOrders(); 