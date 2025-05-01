// Medicine recommendation rules based on symptoms and conditions
const medicineRules = {
  // Pain and Fever
  'headache': {
    primary: ['Paracetamol', 'Ibuprofen'],
    alternatives: ['Aspirin', 'Naproxen'],
    strengths: {
      'Paracetamol': ['500mg', '650mg'],
      'Ibuprofen': ['200mg', '400mg']
    }
  },
  'fever': {
    primary: ['Paracetamol', 'Ibuprofen'],
    alternatives: ['Acetaminophen'],
    strengths: {
      'Paracetamol': ['500mg', '650mg'],
      'Ibuprofen': ['200mg', '400mg']
    }
  },
  'body_pain': {
    primary: ['Ibuprofen', 'Diclofenac'],
    alternatives: ['Naproxen', 'Aceclofenac'],
    strengths: {
      'Ibuprofen': ['400mg', '600mg'],
      'Diclofenac': ['50mg', '75mg']
    }
  },
  
  // Respiratory
  'cough': {
    primary: ['Dextromethorphan', 'Bromhexine'],
    alternatives: ['Ambroxol', 'Guaifenesin'],
    strengths: {
      'Dextromethorphan': ['15mg', '30mg'],
      'Bromhexine': ['4mg', '8mg']
    }
  },
  'cold': {
    primary: ['Phenylephrine', 'Cetirizine'],
    alternatives: ['Pseudoephedrine', 'Loratadine'],
    strengths: {
      'Phenylephrine': ['10mg'],
      'Cetirizine': ['5mg', '10mg']
    }
  },
  'allergies': {
    primary: ['Cetirizine', 'Loratadine'],
    alternatives: ['Fexofenadine', 'Desloratadine'],
    strengths: {
      'Cetirizine': ['5mg', '10mg'],
      'Loratadine': ['5mg', '10mg']
    }
  },
  
  // Digestive
  'acidity': {
    primary: ['Omeprazole', 'Pantoprazole'],
    alternatives: ['Ranitidine', 'Famotidine'],
    strengths: {
      'Omeprazole': ['20mg', '40mg'],
      'Pantoprazole': ['20mg', '40mg']
    }
  },
  'nausea': {
    primary: ['Domperidone', 'Ondansetron'],
    alternatives: ['Metoclopramide'],
    strengths: {
      'Domperidone': ['10mg'],
      'Ondansetron': ['4mg', '8mg']
    }
  },
  'diarrhea': {
    primary: ['Loperamide', 'ORS'],
    alternatives: ['Metronidazole'],
    strengths: {
      'Loperamide': ['2mg'],
      'Metronidazole': ['400mg']
    }
  },
  
  // Skin
  'rash': ['Hydrocortisone', 'Calamine', 'Betamethasone'],
  'acne': ['Benzoyl Peroxide', 'Clindamycin', 'Adapalene'],
  
  // Sleep and Stress
  'insomnia': ['Melatonin', 'Diphenhydramine', 'Doxylamine'],
  'anxiety': ['Chamomile', 'Lavender', 'Passionflower']
};

// Condition-based recommendations with detailed guidelines
const conditionRules = {
  'diabetes': {
    recommended: {
      medicines: ['Sugar-free medicines', 'Metformin', 'Insulin'],
      strengths: {
        'Metformin': ['500mg', '1000mg']
      }
    },
    avoid: ['High sugar content medicines', 'Certain steroids'],
    monitoring: ['Blood sugar levels', 'HbA1c'],
    lifestyle: [
      'Regular exercise (30 minutes daily)',
      'Low glycemic index diet',
      'Regular meal timing',
      'Blood sugar monitoring'
    ]
  },
  'hypertension': {
    recommended: {
      medicines: ['ACE inhibitors', 'Beta blockers', 'Calcium channel blockers'],
      strengths: {
        'Amlodipine': ['5mg', '10mg'],
        'Atenolol': ['25mg', '50mg']
      }
    },
    avoid: ['Decongestants', 'NSAIDs', 'High sodium medications'],
    monitoring: ['Blood pressure', 'Heart rate'],
    lifestyle: [
      'Low sodium diet',
      'Regular exercise',
      'Stress management',
      'Weight management'
    ]
  },
  'pregnancy': {
    recommended: {
      medicines: ['Paracetamol', 'Vitamin supplements'],
      strengths: {
        'Paracetamol': ['500mg'],
        'Folic Acid': ['5mg']
      }
    },
    avoid: ['Aspirin', 'Ibuprofen', 'Certain antibiotics'],
    monitoring: ['Blood pressure', 'Blood sugar', 'Fetal movement'],
    lifestyle: [
      'Regular prenatal checkups',
      'Balanced nutrition',
      'Moderate exercise',
      'Adequate rest'
    ]
  }
};

// Age-based recommendations with specific dosing guidelines
const ageRules = {
  'infant': {
    recommended: {
      forms: ['Drops', 'Syrups'],
      specific: ['Infant formulations', 'Liquid medicines'],
      dosing: 'Based on weight/age chart'
    },
    avoid: ['Adult strength medications', 'Aspirin', 'Tablets'],
    special_instructions: [
      'Use only as prescribed',
      'Always measure doses accurately',
      'Store medicines safely'
    ]
  },
  'child': {
    recommended: {
      forms: ['Syrups', 'Chewable tablets'],
      specific: ['Children formulations', 'Flavored medicines'],
      dosing: 'Based on weight/age chart'
    },
    avoid: ['Adult dosages', 'Strong painkillers'],
    special_instructions: [
      'Follow age-appropriate dosing',
      'Use child-resistant containers',
      'Monitor for side effects'
    ]
  },
  'adult': {
    recommended: {
      forms: ['Tablets', 'Capsules'],
      specific: ['Standard formulations'],
      dosing: 'Standard adult dosing'
    },
    avoid: [],
    special_instructions: [
      'Follow prescribed dosage',
      'Report side effects',
      'Complete full course of medication'
    ]
  },
  'elderly': {
    recommended: {
      forms: ['Easy-to-swallow forms', 'Liquid forms if needed'],
      specific: ['Gentle formulations', 'Modified release forms'],
      dosing: 'Often reduced doses'
    },
    avoid: ['Strong sedatives', 'Certain anticholinergics'],
    special_instructions: [
      'Monitor for interactions',
      'Start with lower doses',
      'Regular medication review'
    ]
  }
};

// Enhanced interaction checker
const checkInteractions = (medicines) => {
  const interactions = [];
  const interactionPairs = {
    'Aspirin': {
      'Warfarin': 'Increased bleeding risk',
      'Ibuprofen': 'Increased risk of GI bleeding',
      'Methotrexate': 'Increased methotrexate toxicity'
    },
    'Omeprazole': {
      'Clopidogrel': 'Reduced effectiveness of clopidogrel',
      'Iron supplements': 'Reduced iron absorption'
    },
    'Simvastatin': {
      'Clarithromycin': 'Increased risk of muscle damage',
      'Erythromycin': 'Increased risk of muscle damage',
      'Grapefruit juice': 'Increased statin levels'
    },
    'Warfarin': {
      'NSAIDs': 'Increased bleeding risk',
      'Aspirin': 'Increased bleeding risk',
      'Antibiotics': 'Altered warfarin effectiveness'
    },
    'ACE inhibitors': {
      'Potassium supplements': 'Risk of high potassium',
      'NSAIDs': 'Reduced blood pressure control'
    }
  };

  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const med1 = medicines[i];
      const med2 = medicines[j];
      
      // Check direct interactions
      if (interactionPairs[med1]?.[med2]) {
        interactions.push({
          medicines: [med1, med2],
          severity: 'significant',
          description: interactionPairs[med1][med2]
        });
      }
      if (interactionPairs[med2]?.[med1]) {
        interactions.push({
          medicines: [med2, med1],
          severity: 'significant',
          description: interactionPairs[med2][med1]
        });
      }
    }
  }
  
  return interactions;
};

// Enhanced recommendation function
const getRecommendations = async ({
  symptoms = [],
  conditions = [],
  age_group = 'adult',
  current_medications = []
}) => {
  try {
    let recommendations = {
      primary_recommendations: new Set(),
      alternative_recommendations: new Set(),
      strengths: {},
      warnings: [],
      interactions: [],
      lifestyle_tips: [],
      monitoring_requirements: new Set(),
      dosing_instructions: []
    };

    // Add randomization to make recommendations more varied
    const randomFactor = Math.random();

    // Generic medicines that can be added for variety
    const genericVarietyMedicines = [
      'Multivitamin Complex', 'Vitamin C', 'Vitamin D3',
      'Vitamin B Complex', 'Zinc Supplement', 'Calcium Supplement',
      'Magnesium', 'Omega-3 Fatty Acids', 'Probiotic Supplements',
      'Iron Supplements', 'Electrolyte Solution'
    ];

    // Additional health-promoting items by category
    const additionalItems = {
      pain: ['Hot/Cold Compress', 'Pain Relief Patch', 'Massage Oil', 'Ginger Tea'],
      respiratory: ['Steam Inhaler', 'Essential Oil Diffuser', 'Humidifier', 'Nasal Rinse Solution'],
      digestive: ['Fiber Supplement', 'Ginger Capsules', 'Digestive Enzymes', 'Mint Tea'],
      sleep: ['Melatonin', 'Chamomile Tea', 'Lavender Oil', 'Sleep Mask'],
      immune: ['Elderberry Syrup', 'Echinacea', 'Garlic Supplements', 'Honey & Lemon Mix']
    };

    // Process symptom-based recommendations with randomization
    symptoms.forEach(symptom => {
      if (medicineRules[symptom]) {
        // Add randomness to primary recommendations
        let primaryMeds = [...medicineRules[symptom].primary];
        let alternativeMeds = [...medicineRules[symptom].alternatives];
        
        // Sometimes swap a primary with an alternative (25% chance)
        if (randomFactor < 0.25 && primaryMeds.length > 0 && alternativeMeds.length > 0) {
          const primaryIndex = Math.floor(Math.random() * primaryMeds.length);
          const altIndex = Math.floor(Math.random() * alternativeMeds.length);
          const temp = primaryMeds[primaryIndex];
          primaryMeds[primaryIndex] = alternativeMeds[altIndex];
          alternativeMeds[altIndex] = temp;
        }
        
        // Sometimes add a variety item (30% chance)
        if (randomFactor < 0.3) {
          const categoryKey = 
            symptom.includes('pain') || symptom.includes('ache') ? 'pain' :
            symptom.includes('cough') || symptom.includes('cold') || symptom.includes('allerg') ? 'respiratory' :
            symptom.includes('acid') || symptom.includes('nausea') || symptom.includes('diarrhea') ? 'digestive' :
            symptom.includes('insomnia') ? 'sleep' : 'immune';
          
          if (additionalItems[categoryKey] && additionalItems[categoryKey].length > 0) {
            const randomIndex = Math.floor(Math.random() * additionalItems[categoryKey].length);
            alternativeMeds.push(additionalItems[categoryKey][randomIndex]);
          }
        }
        
        // Add some generic variety medicines occasionally (20% chance)
        if (randomFactor < 0.2) {
          const varietyIndex = Math.floor(Math.random() * genericVarietyMedicines.length);
          alternativeMeds.push(genericVarietyMedicines[varietyIndex]);
        }

        // Add the medicines to recommendations
        primaryMeds.forEach(med => {
          recommendations.primary_recommendations.add(med);
          if (medicineRules[symptom].strengths[med]) {
            recommendations.strengths[med] = medicineRules[symptom].strengths[med];
          }
        });
        
        alternativeMeds.forEach(med => {
          recommendations.alternative_recommendations.add(med);
        });
      }
    });

    // Process condition-based recommendations
    conditions.forEach(condition => {
      if (conditionRules[condition]) {
        const rule = conditionRules[condition];
        
        // Add recommended medicines
        rule.recommended.medicines.forEach(med => {
          recommendations.primary_recommendations.add(med);
          if (rule.recommended.strengths?.[med]) {
            recommendations.strengths[med] = rule.recommended.strengths[med];
          }
        });

        // Add warnings
        recommendations.warnings.push(
          `Due to ${condition}, avoid: ${rule.avoid.join(', ')}`
        );

        // Add monitoring requirements
        rule.monitoring.forEach(req => 
          recommendations.monitoring_requirements.add(req)
        );

        // Add lifestyle tips with some randomization
        const randomTips = [...rule.lifestyle];
        // Shuffle the tips array
        for (let i = randomTips.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [randomTips[i], randomTips[j]] = [randomTips[j], randomTips[i]];
        }
        
        // Take a subset of tips based on the random factor
        const numTips = Math.max(1, Math.floor(randomTips.length * (0.5 + randomFactor * 0.5)));
        recommendations.lifestyle_tips.push(...randomTips.slice(0, numTips));
      }
    });

    // Apply age-based rules
    if (ageRules[age_group]) {
      const ageRule = ageRules[age_group];
      
      // Add age-specific instructions
      recommendations.dosing_instructions.push(
        `Age group (${age_group}):`,
        `- Recommended forms: ${ageRule.recommended.forms.join(', ')}`,
        `- Dosing: ${ageRule.recommended.dosing}`,
        ...ageRule.special_instructions.map(instr => `- ${instr}`)
      );

      // Add age-specific warnings
      if (ageRule.avoid.length > 0) {
        recommendations.warnings.push(
          `Age-specific warnings: avoid ${ageRule.avoid.join(', ')}`
        );
      }
    }

    // Check for interactions
    if (current_medications.length > 0) {
      const allMeds = [
        ...current_medications,
        ...Array.from(recommendations.primary_recommendations)
      ];
      recommendations.interactions = checkInteractions(allMeds);
    }

    // Add some general recommendations based on the season or time
    const date = new Date();
    const month = date.getMonth();
    
    // Seasonal recommendations
    if (month >= 11 || month <= 1) { // Winter (Dec-Feb)
      recommendations.alternative_recommendations.add("Vitamin D Supplement");
      recommendations.lifestyle_tips.push("Stay warm and hydrated during winter");
    } else if (month >= 2 && month <= 4) { // Spring (Mar-May)
      recommendations.alternative_recommendations.add("Antihistamine");
      recommendations.lifestyle_tips.push("Spring allergy season - keep windows closed during high pollen days");
    } else if (month >= 5 && month <= 7) { // Summer (Jun-Aug)
      recommendations.alternative_recommendations.add("Electrolyte Solution");
      recommendations.lifestyle_tips.push("Stay hydrated and protect skin from sun exposure");
    } else { // Fall (Sep-Nov)
      recommendations.alternative_recommendations.add("Vitamin C");
      recommendations.lifestyle_tips.push("Boost immunity as weather changes in fall");
    }

    // Convert Sets to Arrays for the final output
    return {
      ...recommendations,
      primary_recommendations: Array.from(recommendations.primary_recommendations),
      alternative_recommendations: Array.from(recommendations.alternative_recommendations),
      monitoring_requirements: Array.from(recommendations.monitoring_requirements)
    };
  } catch (error) {
    console.error('Error in recommendation engine:', error);
    throw error;
  }
};

module.exports = {
  getRecommendations,
  medicineRules,
  conditionRules,
  ageRules,
  checkInteractions
}; 