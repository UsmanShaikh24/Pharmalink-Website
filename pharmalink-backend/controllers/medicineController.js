const Medicine = require('../models/Medicine');
const { validationResult } = require('express-validator');
const Pharmacy = require('../models/Pharmacy');
const mongoose = require('mongoose');

// Add new medicine
exports.addMedicine = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicine = new Medicine({
      ...req.body,
      pharmacyId: req.body.pharmacyId // Allow admin to specify pharmacyId
    });

    await medicine.save();
    res.status(201).json({ message: 'Medicine added successfully', medicine });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Medicine with this batch number already exists' });
    }
    res.status(500).json({ message: 'Error adding medicine', error: error.message });
  }
};

// Update medicine details
exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const medicine = await Medicine.findOneAndUpdate(
      { _id: id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine updated successfully', medicine });
  } catch (error) {
    res.status(500).json({ message: 'Error updating medicine', error: error.message });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findOneAndDelete({ _id: id });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting medicine', error: error.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const medicine = await Medicine.findOne({ _id: id });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    let newQuantity;
    if (operation === 'add') {
      newQuantity = medicine.stock.currentQuantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = medicine.stock.currentQuantity - quantity;
      if (newQuantity < 0) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    }

    medicine.stock.currentQuantity = newQuantity;
    await medicine.save();

    // Check if stock is below threshold
    if (newQuantity <= medicine.stock.minThreshold) {
      // TODO: Implement notification system for low stock alert
    }

    res.json({ 
      message: 'Stock updated successfully', 
      currentStock: newQuantity,
      isLowStock: newQuantity <= medicine.stock.minThreshold 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock', error: error.message });
  }
};

// Get all medicines for a pharmacy
exports.getMedicines = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 10,
      lowStock,
      expiringSoon,
      pharmacyId,
      pharmacyName,
      distinct,
      latitude,
      longitude,
      radius = 5,
      requiresPrescription
    } = req.query;

    let pipeline = [];

    // Build match conditions
    const matchConditions = {};

    // Validate pharmacyId
    if (pharmacyId) {
      try {
        // Check if pharmacyId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(pharmacyId)) {
          matchConditions.pharmacyId = new mongoose.Types.ObjectId(pharmacyId);
          console.log("Filtering by pharmacyId:", pharmacyId);
          console.log("Converted ObjectId:", matchConditions.pharmacyId);
        } else {
          console.error("Invalid pharmacyId format:", pharmacyId);
          return res.status(400).json({ message: 'Invalid pharmacyId format' });
        }
      } catch (error) {
        console.error("Error processing pharmacyId:", error);
        return res.status(400).json({ message: 'Invalid pharmacyId format' });
      }
    }

    // If pharmacyName is provided but pharmacyId is not
    else if (pharmacyName) {
      try {
        const pattern = new RegExp(pharmacyName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        const pharmacy = await Pharmacy.findOne({ name: { $regex: pattern } });
        
        if (pharmacy) {
          matchConditions.pharmacyId = pharmacy._id;
          console.log("Found pharmacy with ID:", pharmacy._id);
        } else {
          console.log("No pharmacy found with name:", pharmacyName);
          return res.json({
            medicines: [],
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0
          });
        }
      } catch (error) {
        console.error("Error looking up pharmacy by name:", error);
        return res.status(500).json({ 
          message: 'Error looking up pharmacy by name', 
          error: error.message 
        });
      }
    }

    // Improved search functionality
    if (search) {
      const searchRegex = new RegExp(search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      matchConditions.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { manufacturer: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    if (category && category !== 'All') {
      matchConditions.category = category;
    }

    if (requiresPrescription === 'true') {
      matchConditions.requiresPrescription = true;
    }

    if (lowStock === 'true') {
      matchConditions['stock.currentQuantity'] = { $lte: '$stock.minThreshold' };
    }

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      matchConditions.expiryDate = { $lte: thirtyDaysFromNow };
    }

    // Add match stage if there are any conditions
    if (Object.keys(matchConditions).length > 0) {
      console.log("Match conditions:", JSON.stringify(matchConditions, null, 2));
      pipeline.push({ $match: matchConditions });
    }

    // Lookup pharmacy details with improved error handling
    pipeline.push({
      $lookup: {
        from: 'pharmacies',
        let: { pharmacyId: '$pharmacyId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$pharmacyId'] }
            }
          }
        ],
        as: 'pharmacy'
      }
    });

    // Unwind pharmacy array with preservation of documents where pharmacy is not found
    pipeline.push({
      $unwind: {
        path: '$pharmacy',
        preserveNullAndEmptyArrays: true
      }
    });

    // If location is provided, calculate distances
    if (latitude && longitude) {
      pipeline.push({
        $addFields: {
          distance: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$pharmacy', null] },
                  { $isArray: ['$pharmacy.address.coordinates.coordinates'] },
                  { $eq: [{ $size: '$pharmacy.address.coordinates.coordinates' }, 2] }
                ]
              },
              then: {
                $divide: [
                  {
                    $multiply: [
                      6371, // Earth's radius in kilometers
                      {
                        $acos: {
                          $add: [
                            {
                              $multiply: [
                                { $sin: { $degreesToRadians: parseFloat(latitude) } },
                                { $sin: { $degreesToRadians: { $arrayElemAt: ['$pharmacy.address.coordinates.coordinates', 1] } } }
                              ]
                            },
                            {
                              $multiply: [
                                { $cos: { $degreesToRadians: parseFloat(latitude) } },
                                { $cos: { $degreesToRadians: { $arrayElemAt: ['$pharmacy.address.coordinates.coordinates', 1] } } },
                                { $cos: { 
                                  $subtract: [
                                    { $degreesToRadians: parseFloat(longitude) },
                                    { $degreesToRadians: { $arrayElemAt: ['$pharmacy.address.coordinates.coordinates', 0] } }
                                  ]
                                }}
                              ]
                            }
                          ]
                        }
                      }
                    ]
                  },
                  1
                ]
              },
              else: null
            }
          }
        }
      });

      // Filter by radius if specified
      pipeline.push({
        $match: {
          $or: [
            { distance: { $lte: parseFloat(radius) } },
            { distance: null }
          ]
        }
      });
    }

    // Sort stage
    const sortStage = {};
    switch (sortBy) {
      case 'price_low':
        sortStage.$sort = { price: 1 };
        break;
      case 'price_high':
        sortStage.$sort = { price: -1 };
        break;
      case 'distance':
        if (latitude && longitude) {
          sortStage.$sort = { distance: 1 };
        } else {
          sortStage.$sort = { name: 1 };
        }
        break;
      default:
        sortStage.$sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    }
    pipeline.push(sortStage);

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Project stage to format the output
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        genericName: 1,
        manufacturer: 1,
        description: 1,
        category: 1,
        dosageForm: 1,
        strength: 1,
        price: 1,
        stock: 1,
        expiryDate: 1,
        batchNumber: 1,
        requiresPrescription: 1,
        pharmacy: {
          $cond: {
            if: { $ne: ['$pharmacy', null] },
            then: {
              _id: '$pharmacy._id',
              name: { $ifNull: ['$pharmacy.name', 'Unknown Pharmacy'] },
              address: { $ifNull: ['$pharmacy.address', {}] },
              contactNumber: '$pharmacy.contactNumber',
              operatingHours: '$pharmacy.operatingHours'
            },
            else: {
              _id: null,
              name: 'Unknown Pharmacy',
              address: {},
              contactNumber: null,
              operatingHours: {}
            }
          }
        },
        distance: { $round: ['$distance', 1] }
      }
    });

    // Debug logs
    console.log('Pipeline:', JSON.stringify(pipeline, null, 2));
    console.log('Query params:', req.query);

    // Execute the pipeline
    const medicines = await Medicine.aggregate(pipeline);

    // Debug log for results
    console.log('Medicines count:', medicines.length);
    console.log('Sample medicine:', medicines[0] || 'No results');

    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.splice(-3); // Remove skip, limit, and project stages
    const countResult = await Medicine.aggregate([
      ...countPipeline,
      { $count: 'total' }
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      medicines,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total
    });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      message: 'Error fetching medicines', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get medicine details
exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findOne({ _id: id })
      .populate('pharmacyId', 'name address');

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medicine details', error: error.message });
  }
};

// Get low stock medicines
exports.getLowStockMedicines = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const query = {
      'stock.currentQuantity': { $lte: '$stock.minThreshold' }
    };

    if (pharmacyId) {
      query.pharmacyId = pharmacyId;
    }

    const medicines = await Medicine.find(query)
      .populate('pharmacyId', 'name address');

    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock medicines', error: error.message });
  }
};

// Get expiring medicines
exports.getExpiringMedicines = async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const query = {
      expiryDate: { $lte: thirtyDaysFromNow }
    };

    if (pharmacyId) {
      query.pharmacyId = pharmacyId;
    }

    const medicines = await Medicine.find(query)
      .populate('pharmacyId', 'name address');

    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expiring medicines', error: error.message });
  }
};

// Get medicine suggestions for autocomplete
exports.getMedicineSuggestions = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Medicine.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { genericName: { $regex: search, $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          names: { $addToSet: '$name' },
          genericNames: { $addToSet: '$genericName' }
        }
      },
      {
        $project: {
          _id: 0,
          suggestions: {
            $setUnion: ['$names', '$genericNames']
          }
        }
      }
    ]);

    const uniqueSuggestions = suggestions.length > 0 
      ? suggestions[0].suggestions.slice(0, 10) 
      : [];

    res.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suggestions', error: error.message });
  }
};