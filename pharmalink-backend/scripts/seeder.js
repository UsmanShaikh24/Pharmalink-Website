const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Sample data for pharmacies
const pharmacyData = [
  {
    name: "LifeCare Pharmacy",
    email: "lifecare@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC001",
    address: {
      street: "123 FC Road",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411004",
      coordinates: { latitude: 18.5204, longitude: 73.8567 }
    },
    contactNumber: "9876543210",
    operatingHours: { open: "09:00", close: "21:00" }
  },
  {
    name: "MedPlus Pharmacy",
    email: "medplus@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC002",
    address: {
      street: "456 MG Road, Camp",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411001",
      coordinates: { latitude: 18.5167, longitude: 73.8718 }
    },
    contactNumber: "9876543211",
    operatingHours: { open: "08:00", close: "22:00" }
  },
  {
    name: "Apollo Pharmacy",
    email: "apollo@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC003",
    address: {
      street: "789 Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411001",
      coordinates: { latitude: 18.5362, longitude: 73.8931 }
    },
    contactNumber: "9876543212",
    operatingHours: { open: "08:30", close: "21:30" }
  },
  {
    name: "Wellness Forever",
    email: "wellness@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC004",
    address: {
      street: "321 Aundh Road",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411007",
      coordinates: { latitude: 18.5590, longitude: 73.8075 }
    },
    contactNumber: "9876543213",
    operatingHours: { open: "09:30", close: "20:30" }
  },
  {
    name: "Noble Pharmacy",
    email: "noble@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC005",
    address: {
      street: "567 Baner Road",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411045",
      coordinates: { latitude: 18.5590, longitude: 73.7868 }
    },
    contactNumber: "9876543214",
    operatingHours: { open: "09:00", close: "20:00" }
  },
  {
    name: "Care & Cure Pharmacy",
    email: "carecure@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC006",
    address: {
      street: "890 Viman Nagar",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411014",
      coordinates: { latitude: 18.5679, longitude: 73.9143 }
    },
    contactNumber: "9876543215",
    operatingHours: { open: "08:00", close: "23:00" }
  },
  {
    name: "Health First Pharmacy",
    email: "healthfirst@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC007",
    address: {
      street: "432 Kothrud",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411038",
      coordinates: { latitude: 18.5074, longitude: 73.8077 }
    },
    contactNumber: "9876543216",
    operatingHours: { open: "09:00", close: "22:00" }
  },
  {
    name: "MediCare Plus",
    email: "medicare@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC008",
    address: {
      street: "765 Hadapsar",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411028",
      coordinates: { latitude: 18.5089, longitude: 73.9260 }
    },
    contactNumber: "9876543217",
    operatingHours: { open: "08:30", close: "21:30" }
  },
  {
    name: "Family Pharmacy",
    email: "family@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC009",
    address: {
      street: "987 Shivaji Nagar",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411005",
      coordinates: { latitude: 18.5314, longitude: 73.8446 }
    },
    contactNumber: "9876543218",
    operatingHours: { open: "09:30", close: "20:30" }
  },
  {
    name: "City Medicals",
    email: "citymed@example.com",
    password: "pharmacy123",
    licenseNumber: "LIC010",
    address: {
      street: "654 Kalyani Nagar",
      city: "Pune",
      state: "Maharashtra",
      zipCode: "411006",
      coordinates: { latitude: 18.5485, longitude: 73.9006 }
    },
    contactNumber: "9876543219",
    operatingHours: { open: "09:00", close: "21:00" }
  }
];

// Medicine categories and examples
const medicineCategories = {
  'Pain Relief': [
    { name: 'Paracetamol', genericName: 'Acetaminophen', dosageForm: 'Tablet' },
    { name: 'Ibuprofen', genericName: 'Ibuprofen', dosageForm: 'Tablet' },
    { name: 'Aspirin', genericName: 'Acetylsalicylic acid', dosageForm: 'Tablet' }
  ],
  'Antibiotics': [
    { name: 'Amoxicillin', genericName: 'Amoxicillin', dosageForm: 'Capsule' },
    { name: 'Azithromycin', genericName: 'Azithromycin', dosageForm: 'Tablet' },
    { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', dosageForm: 'Tablet' }
  ],
  'Antacids': [
    { name: 'Pantoprazole', genericName: 'Pantoprazole', dosageForm: 'Tablet' },
    { name: 'Ranitidine', genericName: 'Ranitidine', dosageForm: 'Tablet' },
    { name: 'Omeprazole', genericName: 'Omeprazole', dosageForm: 'Capsule' }
  ]
};

// Helper to generate medicine data
const generateMedicineData = (pharmacyId, baseData) => {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);

  return {
    pharmacyId,
    ...baseData,
    manufacturer: 'Generic Pharma Ltd.',
    description: `Standard ${baseData.dosageForm.toLowerCase()} form of ${baseData.genericName}`,
    category: Object.keys(medicineCategories).find(cat =>
      medicineCategories[cat].some(med => med.name === baseData.name)
    ),
    strength: {
      value: 500,
      unit: 'mg'
    },
    price: Math.floor(Math.random() * 200) + 50,
    stock: {
      currentQuantity: Math.floor(Math.random() * 100) + 50,
      minThreshold: 10,
      unit: baseData.dosageForm === 'Tablet' || baseData.dosageForm === 'Capsule' ? 'Strips' : 'Units'
    },
    expiryDate,
    batchNumber: 'B' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    requiresPrescription: Math.random() > 0.5
  };
};

// Seed Function
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    await Pharmacy.deleteMany({});
    await Medicine.deleteMany({});
    console.log('Cleared existing data');

    const pharmacies = [];
    for (const data of pharmacyData) {
      // Convert lat/lng to GeoJSON format
      const { latitude, longitude } = data.address.coordinates;
      data.address.coordinates = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const pharmacy = await Pharmacy.create({
        ...data,
        password: hashedPassword,
        isVerified: true
      });
      pharmacies.push(pharmacy);
    }
    console.log('Created pharmacies');

    // Seed medicines
    for (const pharmacy of pharmacies) {
      const allMedicines = Object.values(medicineCategories).flat();
      for (const medicineBase of allMedicines) {
        await Medicine.create(generateMedicineData(pharmacy._id, medicineBase));
      }
    }
    console.log('Created medicines');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
