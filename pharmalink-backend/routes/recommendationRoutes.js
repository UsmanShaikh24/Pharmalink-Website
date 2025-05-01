const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getMedicineRecommendations,
  getHealthTips
} = require('../controllers/recommendationController');

// Routes for medicine recommendations
router.post('/medicines', auth, getMedicineRecommendations);
router.post('/health-tips', auth, getHealthTips);

module.exports = router; 