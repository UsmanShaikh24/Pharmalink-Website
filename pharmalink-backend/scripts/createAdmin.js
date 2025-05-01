const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Admin user details
const adminUser = {
  name: 'Admin',
  email: 'admin@pharmalink.com',
  password: 'admin123',
  phoneNumber: '1234567890',
  role: 'admin',
  address: {
    street: 'Admin Street',
    city: 'Admin City',
    state: 'Admin State',
    zipCode: '123456'
  }
};

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink7', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Delete existing admin if exists
    await User.deleteOne({ email: adminUser.email });
    console.log('Removed existing admin user if any');

    // Create admin user using the User model directly
    const admin = new User(adminUser);
    await admin.save();
    console.log('Admin user created successfully');

    // Verify admin was created correctly
    const verifyAdmin = await User.findOne({ email: adminUser.email });
    if (verifyAdmin && verifyAdmin.role === 'admin') {
      console.log('Admin user verified successfully');
      // Test password comparison
      const isValidPassword = await verifyAdmin.comparePassword('admin123');
      console.log('Password verification:', isValidPassword);
    } else {
      console.error('Admin user verification failed');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 