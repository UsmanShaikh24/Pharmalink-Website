const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function checkAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink7', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@pharmalink.com' });
    
    if (admin) {
      console.log('Admin user found:');
      console.log({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      });
    } else {
      console.log('No admin user found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin(); 