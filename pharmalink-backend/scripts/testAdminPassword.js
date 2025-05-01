const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function testAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink7', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@pharmalink.com' });
    
    if (!admin) {
      console.log('No admin user found');
      process.exit(1);
    }

    // Test password comparison
    const testPassword = 'admin123';
    console.log('Testing password:', testPassword);
    console.log('Stored hashed password:', admin.password);
    
    const isMatch = await admin.comparePassword(testPassword);
    console.log('Password match:', isMatch);

    // Create a new hash of the same password to verify bcrypt is working
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(testPassword, salt);
    console.log('New hash of same password:', newHash);
    
    // Compare the new hash directly
    const directCompare = await bcrypt.compare(testPassword, admin.password);
    console.log('Direct bcrypt compare:', directCompare);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAdminPassword(); 