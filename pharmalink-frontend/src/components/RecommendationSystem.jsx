import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  CircularProgress,
  Autocomplete,
  Paper,
  Divider,
  Tooltip,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import {
  LocalPharmacy,
  Info as InfoIcon,
  TipsAndUpdates as TipsIcon,
  Refresh as RefreshIcon,
  FavoriteBorder as HeartIcon,
  NewReleases as NewIcon,
  Medication as MedicationIcon,
  LocationOn as LocationIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import axios from 'axios';
import debounce from 'lodash/debounce';

// Common symptoms and conditions for autocomplete
const commonSymptoms = [
  'headache', 'fever', 'body_pain', 'cough', 'cold',
  'allergies', 'acidity', 'nausea', 'diarrhea',
  'rash', 'acne', 'insomnia', 'anxiety'
];

const commonConditions = [
  'diabetes', 'hypertension', 'pregnancy'
];

const ageGroups = ['infant', 'child', 'adult', 'elderly'];

const RecommendationSystem = () => {
  const [formData, setFormData] = useState({
    symptoms: [],
    conditions: [],
    age_group: 'adult',
    current_medications: []
  });

  const [recommendations, setRecommendations] = useState(null);
  const [healthTips, setHealthTips] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [displayVariation, setDisplayVariation] = useState(Math.random());
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle medicine search
  const handleMedicineSearch = async (searchText) => {
    if (!searchText || searchText.length < 2) return;
    
    setLoadingMedicines(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to search medicines');
        return;
      }

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseURL}/api/medicines/suggestions`, {
        params: {
          search: searchText
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const suggestions = response.data?.suggestions || [];
      if (!Array.isArray(suggestions)) {
        console.error('Invalid suggestions format:', suggestions);
        setError('Invalid response format from server');
        return;
      }

      const newOptions = suggestions.map(med => ({
        id: Math.random().toString(36).substr(2, 9),
        label: med,
        value: med
      }));

      setMedicineOptions(newOptions);
      setError(null);
    } catch (err) {
      console.error('Error searching medicines:', err);
      if (err.response?.status === 401) {
        setError('Please log in to search medicines');
      } else {
        setError('Failed to search medicines. Please try again.');
      }
      setMedicineOptions([]);
    } finally {
      setLoadingMedicines(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((searchText) => handleMedicineSearch(searchText), 300),
    []
  );

  // Fetch initial medicine options
  useEffect(() => {
    const fetchInitialMedicines = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view medicines');
          return;
        }

        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${baseURL}/api/medicines/suggestions`, {
          params: {
            search: ''
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const suggestions = response.data?.suggestions || [];
        if (!Array.isArray(suggestions)) {
          throw new Error('Invalid medicines data received');
        }

        const options = suggestions.map(med => ({
          id: Math.random().toString(36).substr(2, 9),
          label: med,
          value: med
        }));

        setMedicineOptions(options);
        setError(null);
      } catch (err) {
        console.error('Error fetching medicines:', err);
        if (err.response?.status === 401) {
          setError('Please log in to view medicines');
        } else {
          setError('Failed to load medicine suggestions. Please try again later.');
        }
        setMedicineOptions([]);
      } finally {
        setLoadingMedicines(false);
      }
    };

    fetchInitialMedicines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to use the recommendation system');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Get medicine recommendations
      const medicineResponse = await axios.post(
        '/api/recommendations/medicines',
        {
          ...formData,
          current_medications: formData.current_medications.map(med => 
            typeof med === 'string' ? med : med.value
          )
        },
        config
      );
      
      const recommendationsData = medicineResponse.data?.data?.recommendations || medicineResponse.data?.recommendations;
      if (!recommendationsData) {
        throw new Error('Invalid recommendation data structure');
      }
      
      setRecommendations(recommendationsData);

      // Get health tips
      const tipsResponse = await axios.post(
        '/api/recommendations/health-tips',
        {
          conditions: formData.conditions,
          age_group: formData.age_group
        },
        config
      );
      
      const tipsData = tipsResponse.data?.data || tipsResponse.data;
      if (!tipsData?.health_tips) {
        throw new Error('Invalid health tips data structure');
      }
      
      setHealthTips(tipsData);
    } catch (err) {
      console.error('Error in recommendation system:', err);
      const errorMessage = err.response?.status === 401 
        ? 'Please log in to use the recommendation system'
        : err.response?.data?.message || err.message || 'Error fetching recommendations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Custom equality check for Autocomplete
  const isOptionEqualToValue = (option, value) => {
    if (typeof value === 'string') {
      return option.value === value || option.label === value;
    }
    return option.id === value.id;
  };

  // Randomize display every time the component renders or results change
  useEffect(() => {
    setDisplayVariation(Math.random());
  }, [recommendations, healthTips]);

  // New function to refresh recommendations with some randomness
  const refreshRecommendations = () => {
    setRefreshKey(prev => prev + 1);
    setDisplayVariation(Math.random());
    
    // If we already have recommendations, just update the display variation
    if (recommendations) {
      // Shuffle the order of existing recommendations to create variety
      if (recommendations.primary_recommendations) {
        const shuffledPrimary = [...recommendations.primary_recommendations];
        for (let i = shuffledPrimary.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledPrimary[i], shuffledPrimary[j]] = [shuffledPrimary[j], shuffledPrimary[i]];
        }
        
        const shuffledAlt = [...(recommendations.alternative_recommendations || [])];
        for (let i = shuffledAlt.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledAlt[i], shuffledAlt[j]] = [shuffledAlt[j], shuffledAlt[i]];
        }
        
        setRecommendations({
          ...recommendations,
          primary_recommendations: shuffledPrimary,
          alternative_recommendations: shuffledAlt
        });
      }
      
      // Shuffle health tips too if they exist
      if (healthTips && healthTips.health_tips) {
        const shuffledTips = [...healthTips.health_tips];
        for (let i = shuffledTips.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledTips[i], shuffledTips[j]] = [shuffledTips[j], shuffledTips[i]];
        }
        
        setHealthTips({
          ...healthTips,
          health_tips: shuffledTips
        });
      }
    }
  };

  // Modified function to organize medicines by name first, then by pharmacy
  const organizeByMedicineThenPharmacy = useMemo(() => {
    if (!recommendations?.available_medicines) return [];
    
    // Group medicines by name
    const groupedByMedicine = recommendations.available_medicines.reduce((acc, med) => {
      const medicineName = med.name;
      if (!acc[medicineName]) {
        acc[medicineName] = {
          name: medicineName,
          genericName: med.genericName,
          category: med.category,
          pharmacies: []
        };
      }
      
      // Add pharmacy to this medicine if it doesn't exist already
      const pharmacyExists = acc[medicineName].pharmacies.some(
        p => p.pharmacyId?._id === med.pharmacyId?._id
      );
      
      if (!pharmacyExists && med.pharmacyId) {
        acc[medicineName].pharmacies.push({
          pharmacyId: med.pharmacyId,
          price: med.price,
          stock: med.stock,
          availability: med.stock?.currentQuantity > 0 ? 'In Stock' : 'Out of Stock'
        });
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by name
    return Object.values(groupedByMedicine).sort((a, b) => a.name.localeCompare(b.name));
  }, [recommendations, refreshKey]);

  // Generate random pastel color for medicine cards
  const getMedicineCardColor = (index) => {
    const colors = [
      'rgba(144, 202, 249, 0.15)', // light blue
      'rgba(129, 199, 132, 0.15)', // light green
      'rgba(244, 143, 177, 0.15)', // light pink
      'rgba(255, 183, 77, 0.15)',  // light orange
      'rgba(186, 104, 200, 0.15)', // light purple
    ];
    return colors[index % colors.length];
  };

  // Modified display for recommendations organized by medicine first
  const renderMedicineOrganizedRecommendations = () => {
    if (!recommendations?.available_medicines || recommendations.available_medicines.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No specific medicine recommendations found. Please try with different symptoms or conditions.
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <MedicationIcon sx={{ mr: 1 }} /> Medicine Recommendations
          </Typography>
          <Tooltip title="Refresh recommendations">
            <IconButton onClick={refreshRecommendations} color="primary" aria-label="refresh recommendations">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Grid container spacing={3}>
          {organizeByMedicineThenPharmacy.map((medicine, index) => (
            <Grid item xs={12} md={6} key={`${medicine.name}-${index}`}>
              <Paper 
                elevation={3}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <Box 
                  sx={{ 
                    p: 2, 
                    backgroundColor: getMedicineCardColor(index),
                    borderBottom: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <MedicationIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div" fontWeight="bold">
                          {medicine.name}
                        </Typography>
                        {medicine.genericName && (
                          <Typography variant="body2" color="text.secondary">
                            Generic: {medicine.genericName}
                          </Typography>
                        )}
                        {medicine.category && (
                          <Chip 
                            label={medicine.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mt: 1 }} 
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {medicine.pharmacies.length > 0 && (
                      <Chip 
                        label={`Available at ${medicine.pharmacies.length} ${medicine.pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'}`}
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ p: 0 }}>
                  <List disablePadding>
                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
                      <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Available at:
                    </Typography>
                    <Divider />
                    
                    {medicine.pharmacies.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="Not available at any nearby pharmacies" />
                      </ListItem>
                    ) : (
                      medicine.pharmacies.map((pharmacy, pIndex) => (
                        <ListItem 
                          key={`${pharmacy.pharmacyId?._id || pIndex}`}
                          divider={pIndex < medicine.pharmacies.length - 1}
                          sx={{ 
                            bgcolor: pharmacy.availability === 'In Stock' ? 'success.light' : 'warning.light',
                            '&:hover': { bgcolor: pharmacy.availability === 'In Stock' ? 'success.light' : 'warning.light' }
                          }}
                        >
                          <ListItemIcon>
                            <StoreIcon color={pharmacy.availability === 'In Stock' ? 'success' : 'warning'} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Typography fontWeight="medium">
                                {pharmacy.pharmacyId?.name || 'Unknown Pharmacy'}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                {pharmacy.pharmacyId?.address?.city && (
                                  <Typography variant="body2" component="span">
                                    {pharmacy.pharmacyId.address.city}
                                    {pharmacy.pharmacyId.address.street && `, ${pharmacy.pharmacyId.address.street}`}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {pharmacy.price && (
                              <Typography variant="body1" fontWeight="bold">
                                ₹{pharmacy.price.toFixed(2)}
                              </Typography>
                            )}
                            <Chip 
                              size="small"
                              label={pharmacy.availability} 
                              color={pharmacy.availability === 'In Stock' ? 'success' : 'warning'}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Replace the old renderMedicineRecommendations with the new one
  const renderMedicineRecommendations = renderMedicineOrganizedRecommendations;

  // Modified health tips display
  const renderHealthTips = () => {
    if (!healthTips?.health_tips || healthTips.health_tips.length === 0) return null;
    
    // Randomize display style
    const tipStyle = displayVariation < 0.5 ? "cards" : "list";
    
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TipsIcon sx={{ mr: 1 }} /> Health Tips
        </Typography>
        
        {tipStyle === "cards" ? (
          <Grid container spacing={2}>
            {healthTips.health_tips.map((tip, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper 
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    background: getMedicineCardColor(index),
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1">
                    {tip}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={2}>
              {healthTips.health_tips.map((tip, index) => (
                <Grid item xs={12} key={index}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'info.light' }
                  }}>
                    <Typography variant="body1">
                      • {tip}
                    </Typography>
                  </Box>
                  {index < healthTips.health_tips.length - 1 && <Divider />}
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Medicine Recommendation System
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Symptoms Selection */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={commonSymptoms}
                value={formData.symptoms}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, symptoms: newValue }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Symptoms"
                    placeholder="Select or type symptoms"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                freeSolo
              />
            </Grid>

            {/* Medical Conditions */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={commonConditions}
                value={formData.conditions}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, conditions: newValue }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Medical Conditions"
                    placeholder="Select or type conditions"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                freeSolo
              />
            </Grid>

            {/* Age Group Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Age Group</InputLabel>
                <Select
                  value={formData.age_group}
                  label="Age Group"
                  onChange={(e) => setFormData(prev => ({ ...prev, age_group: e.target.value }))}
                >
                  {ageGroups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Current Medications */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={medicineOptions}
                loading={loadingMedicines}
                value={formData.current_medications}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, current_medications: newValue }))}
                onInputChange={(_, value) => {
                  if (value.length >= 2) {
                    debouncedSearch(value);
                  }
                }}
                isOptionEqualToValue={isOptionEqualToValue}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.label || '';
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Current Medications"
                    placeholder="Type to search medicines"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingMedicines ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={option.id} {...otherProps}>
                      <Box>
                        <Typography variant="body1">{option.label}</Typography>
                        {option.category && (
                          <Typography variant="caption" color="text.secondary">
                            Category: {option.category}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Getting Recommendations...
                  </>
                ) : (
                  'Get Recommendations'
                )}
              </Button>
            </Grid>
          </Grid>

          {/* Display Recommendations */}
          {recommendations && recommendations.available_medicines && renderMedicineRecommendations()}

          {/* Display Health Tips */}
          {healthTips && healthTips.health_tips && renderHealthTips()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RecommendationSystem; 