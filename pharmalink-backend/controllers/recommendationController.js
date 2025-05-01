const { getRecommendations } = require('../utils/recommendationEngine');
const Medicine = require('../models/Medicine');

// Get medicine recommendations based on symptoms and conditions
exports.getMedicineRecommendations = async (req, res) => {
  try {
    const { symptoms, conditions, age_group, current_medications } = req.body;

    // Add random factor for more varied responses
    const randomFactor = Math.random();
    
    // Slightly vary the input based on randomization for more diverse results
    let processedSymptoms = [...symptoms];
    let processedConditions = [...conditions];
    
    // Sometimes add a general health condition (20% chance)
    if (randomFactor < 0.2 && !conditions.includes('general_health')) {
      processedConditions.push('general_health');
    }
    
    // Sometimes prioritize different symptoms (30% chance)
    if (randomFactor < 0.3 && processedSymptoms.length > 1) {
      // Shuffle symptoms to prioritize them differently
      for (let i = processedSymptoms.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [processedSymptoms[i], processedSymptoms[j]] = [processedSymptoms[j], processedSymptoms[i]];
      }
      
      // Take a subset of symptoms to focus on
      const symptomsToUse = Math.max(1, Math.floor(processedSymptoms.length * 0.75));
      processedSymptoms = processedSymptoms.slice(0, symptomsToUse);
    }

    // Get recommendations from the engine
    const recommendations = await getRecommendations({
      symptoms: processedSymptoms,
      conditions: processedConditions,
      age_group,
      current_medications
    });

    // Find actual medicines in database that match recommendations
    // Add a more varied selection using OR queries
    const recommendedMedicines = await Medicine.find({
      $or: [
        { name: { $in: recommendations.primary_recommendations } },
        { genericName: { $in: recommendations.primary_recommendations } },
        // Randomize whether to include alternatives in the main results
        ...(randomFactor < 0.4 ? [{ name: { $in: recommendations.alternative_recommendations } }] : []),
        ...(randomFactor < 0.4 ? [{ genericName: { $in: recommendations.alternative_recommendations } }] : [])
      ]
    }).populate('pharmacyId', 'name address');

    // Group medicines by category
    const groupedMedicines = recommendedMedicines.reduce((acc, medicine) => {
      if (!acc[medicine.category]) {
        acc[medicine.category] = [];
      }
      acc[medicine.category].push(medicine);
      return acc;
    }, {});

    // Add availability information
    const medicinesWithAvailability = recommendedMedicines.map(medicine => ({
      ...medicine.toObject(),
      availability: medicine.stock?.currentQuantity > 0 ? 'In Stock' : 'Out of Stock',
      nearestPharmacy: medicine.pharmacyId,
      // Add random "match score" for more diverse sorting in frontend
      matchScore: Math.floor(70 + Math.random() * 30)
    }));

    // If we have too few results, try to expand the search
    if (medicinesWithAvailability.length < 3 && recommendations.alternative_recommendations.length > 0) {
      const additionalMedicines = await Medicine.find({
        $or: [
          { name: { $in: recommendations.alternative_recommendations } },
          { genericName: { $in: recommendations.alternative_recommendations } }
        ]
      }).populate('pharmacyId', 'name address');

      // Add these to our results
      additionalMedicines.forEach(med => {
        if (!medicinesWithAvailability.some(existing => existing._id.toString() === med._id.toString())) {
          medicinesWithAvailability.push({
            ...med.toObject(),
            availability: med.stock?.currentQuantity > 0 ? 'In Stock' : 'Out of Stock',
            nearestPharmacy: med.pharmacyId,
            matchScore: Math.floor(50 + Math.random() * 20), // Lower match score for alternatives
            isAlternative: true // Mark as alternative
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        recommendations: {
          ...recommendations,
          available_medicines: medicinesWithAvailability,
          medicines_by_category: groupedMedicines
        },
        total_recommendations: medicinesWithAvailability.length,
        // Add a session identifier to make each request appear unique
        session_id: Date.now().toString(36) + Math.random().toString(36).substr(2)
      }
    });
  } catch (error) {
    console.error('Error in medicine recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message
    });
  }
};

// Get personalized health tips
exports.getHealthTips = async (req, res) => {
  try {
    const { conditions = [], age_group = 'adult' } = req.body;
    
    const healthTips = [];
    
    // Add random factor for more varied responses
    const randomFactor = Math.random();
    
    // General health tips - randomize which ones are included
    const generalTips = [
      'Stay hydrated by drinking plenty of water',
      'Maintain a balanced diet rich in fruits and vegetables',
      'Get regular exercise and adequate sleep',
      'Practice good posture when sitting and standing',
      'Take breaks from screens every 20-30 minutes',
      'Practice deep breathing exercises for stress relief',
      'Maintain a consistent sleep schedule',
      'Stay up to date with vaccinations',
      'Wash hands frequently to prevent infections',
      'Limit processed foods and added sugars',
      'Make time for activities you enjoy',
      'Spend time in nature when possible'
    ];
    
    // Shuffle the general tips
    for (let i = generalTips.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generalTips[i], generalTips[j]] = [generalTips[j], generalTips[i]];
    }
    
    // Take a random number of tips between 3 and 5
    const numGeneralTips = 3 + Math.floor(randomFactor * 3);
    healthTips.push(...generalTips.slice(0, numGeneralTips));

    // Condition-specific tips with randomization
    if (conditions.includes('diabetes')) {
      const diabetesTips = [
        'Monitor blood sugar levels regularly',
        'Avoid sugary foods and drinks',
        'Keep a diabetes management diary',
        'Check your feet daily for cuts or sores',
        'Maintain a consistent meal schedule',
        'Consider using a continuous glucose monitor',
        'Work with a dietitian to create a diabetes-friendly meal plan',
        'Carry fast-acting carbohydrates for hypoglycemia'
      ];
      
      // Shuffle and select 2-3 random tips
      for (let i = diabetesTips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [diabetesTips[i], diabetesTips[j]] = [diabetesTips[j], diabetesTips[i]];
      }
      
      healthTips.push(...diabetesTips.slice(0, 2 + Math.floor(randomFactor * 2)));
    }

    if (conditions.includes('hypertension')) {
      const hyperTips = [
        'Monitor blood pressure regularly',
        'Reduce salt intake',
        'Practice stress management techniques',
        'Limit alcohol consumption',
        'Consider the DASH diet approach',
        'Read food labels to identify hidden sodium',
        'Take blood pressure medication as prescribed',
        'Record blood pressure readings in a journal'
      ];
      
      // Shuffle and select 2-3 random tips
      for (let i = hyperTips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [hyperTips[i], hyperTips[j]] = [hyperTips[j], hyperTips[i]];
      }
      
      healthTips.push(...hyperTips.slice(0, 2 + Math.floor(randomFactor * 2)));
    }

    // Age-specific tips with randomization
    if (age_group === 'elderly') {
      const elderlyTips = [
        'Regular health check-ups are important',
        'Stay socially active',
        'Keep your mind engaged with puzzles or reading',
        'Consider a medical alert system',
        'Fall-proof your home by removing trip hazards',
        'Use pill organizers for medication management',
        'Focus on balance exercises to prevent falls',
        'Consider vitamin D supplementation'
      ];
      
      // Shuffle and select 2-3 random tips
      for (let i = elderlyTips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elderlyTips[i], elderlyTips[j]] = [elderlyTips[j], elderlyTips[i]];
      }
      
      healthTips.push(...elderlyTips.slice(0, 2 + Math.floor(randomFactor * 2)));
    } else if (age_group === 'child') {
      const childTips = [
        'Ensure regular vaccination schedule',
        'Maintain good hygiene habits',
        'Get adequate physical activity',
        'Limit screen time',
        'Encourage a diverse diet with fruits and vegetables',
        'Establish a regular bedtime routine',
        'Teach hand washing after bathroom use and before eating',
        'Make sure they wear protective gear during sports activities'
      ];
      
      // Shuffle and select 2-3 random tips
      for (let i = childTips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [childTips[i], childTips[j]] = [childTips[j], childTips[i]];
      }
      
      healthTips.push(...childTips.slice(0, 2 + Math.floor(randomFactor * 2)));
    }

    // Add seasonal tips based on current month
    const date = new Date();
    const month = date.getMonth();
    
    const seasonalTips = {
      winter: [
        'Protect skin from cold, dry air with moisturizer',
        'Wash hands frequently during cold and flu season',
        'Stay active indoors if weather prevents outdoor activity'
      ],
      spring: [
        'Take antihistamines before symptoms appear if you have seasonal allergies',
        'Gradually increase outdoor activity as weather improves',
        'Keep windows closed during high pollen days'
      ],
      summer: [
        'Apply sunscreen 30 minutes before sun exposure',
        'Stay hydrated in hot weather',
        'Wear lightweight, light-colored clothing in hot weather'
      ],
      fall: [
        'Get a flu shot before the peak of flu season',
        'Prepare for shorter days and their impact on mood',
        'Check home heating systems before cold weather arrives'
      ]
    };
    
    let seasonalTipsArray = [];
    if (month >= 11 || month <= 1) { // Winter
      seasonalTipsArray = seasonalTips.winter;
    } else if (month >= 2 && month <= 4) { // Spring
      seasonalTipsArray = seasonalTips.spring;
    } else if (month >= 5 && month <= 7) { // Summer
      seasonalTipsArray = seasonalTips.summer;
    } else { // Fall
      seasonalTipsArray = seasonalTips.fall;
    }
    
    // Add 1-2 seasonal tips
    healthTips.push(...seasonalTipsArray.slice(0, 1 + Math.floor(randomFactor * 2)));

    res.json({
      success: true,
      data: {
        health_tips: healthTips,
        // Top 3 most relevant tips might be different each time
        lifestyle_recommendations: healthTips.slice(0, 3 + Math.floor(randomFactor * 2)), 
        total_tips: healthTips.length,
        // Add a session identifier to make each request appear unique
        session_id: Date.now().toString(36) + Math.random().toString(36).substr(2)
      }
    });
  } catch (error) {
    console.error('Error generating health tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating health tips',
      error: error.message
    });
  }
}; 