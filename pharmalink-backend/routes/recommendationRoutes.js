const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getMedicineRecommendations,
  getHealthTips
} = require('../controllers/recommendationController');

// Public routes for guest users
router.post('/public/medicines', getMedicineRecommendations);
router.post('/public/health-tips', getHealthTips);

// Authenticated routes for logged-in users
router.post('/medicines', auth, getMedicineRecommendations);
router.post('/health-tips', auth, getHealthTips);

module.exports = router; 
