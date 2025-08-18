const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const medicineController = require('../controllers/medicineController');

// Validation middleware
const medicineValidation = [
  check('name').trim().notEmpty().withMessage('Medicine name is required'),
  check('genericName').trim().notEmpty().withMessage('Generic name is required'),
  check('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  check('category').trim().notEmpty().withMessage('Category is required'),
  check('dosageForm').notEmpty().withMessage('Dosage form is required')
    .isIn(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Other'])
    .withMessage('Invalid dosage form'),
  check('price').isNumeric().withMessage('Price must be a number')
    .custom(value => value >= 0).withMessage('Price cannot be negative'),
  check('stock.currentQuantity').isNumeric().withMessage('Stock quantity must be a number')
    .custom(value => value >= 0).withMessage('Stock quantity cannot be negative'),
  check('stock.minThreshold').isNumeric().withMessage('Minimum threshold must be a number')
    .custom(value => value >= 0).withMessage('Minimum threshold cannot be negative'),
  check('stock.unit').notEmpty().withMessage('Stock unit is required')
    .isIn(['Strips', 'Bottles', 'Units', 'Boxes']).withMessage('Invalid stock unit'),
  check('expiryDate').isISO8601().withMessage('Invalid expiry date'),
  check('batchNumber').trim().notEmpty().withMessage('Batch number is required')
];

// Stock update validation
const stockUpdateValidation = [
  check('quantity').isNumeric().withMessage('Quantity must be a number')
    .custom(value => value > 0).withMessage('Quantity must be positive'),
  check('operation').isIn(['add', 'subtract']).withMessage('Invalid operation type')
];

// Public routes
router.get('/suggestions', medicineController.getMedicineSuggestions);
router.get('/detail/:id', medicineController.getMedicineById);
router.get('/browse', medicineController.getMedicines); // Public browsing endpoint

// Authenticated user routes
router.get('/', auth, medicineController.getMedicines);

// Admin only routes
router.get('/admin', adminAuth, medicineController.getMedicines);
router.post('/', adminAuth, medicineValidation, medicineController.addMedicine);
router.put('/:id', adminAuth, medicineValidation, medicineController.updateMedicine);
router.delete('/:id', adminAuth, medicineController.deleteMedicine);
router.patch('/:id/stock', adminAuth, stockUpdateValidation, medicineController.updateStock);

module.exports = router; 
