import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  LocationOn,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { register } = useAuth();
  const autocompleteInput = useRef(null);
  const [placesService, setPlacesService] = useState(null);
  const [addressPredictions, setAddressPredictions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  // Form states
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [addressInput, setAddressInput] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);

  // Initialize Google Places API
  useEffect(() => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      const autocomplete = new window.google.maps.places.AutocompleteService();
      const places = new window.google.maps.places.PlacesService(document.createElement('div'));
      setPlacesService({ autocomplete, places });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      setScriptLoaded(true);
      try {
        const autocomplete = new window.google.maps.places.AutocompleteService();
        const places = new window.google.maps.places.PlacesService(document.createElement('div'));
        setPlacesService({ autocomplete, places });
      } catch (error) {
        console.error('Error initializing Places service:', error);
        setScriptError('Failed to initialize Places service');
      }
    };

    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      setScriptError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      const scriptElement = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  // User form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9!@#$%^&*]/)) strength += 25;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return theme.palette.error.main;
    if (passwordStrength <= 50) return theme.palette.warning.main;
    if (passwordStrength <= 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelect = (prediction) => {
    if (!prediction || !placesService) return;

    setAddressLoading(true);
    placesService.places.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry'],
      },
      (place, status) => {
        setAddressLoading(false);
        if (status === 'OK' && place) {
          const addressComponents = place.address_components;
          
          // Extract address components for Indian format
          const streetNumber = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
          const route = addressComponents.find(c => c.types.includes('route'))?.long_name || '';
          const sublocality = addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name || '';
          const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
          const city = addressComponents.find(c => 
            c.types.includes('administrative_area_level_2') || 
            c.types.includes('locality')
          )?.long_name;
          const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
          const pinCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name;

          // Combine street address components
          const street = [streetNumber, route, sublocality, locality]
            .filter(Boolean)
            .join(', ');

          const finalStreet = street || place.formatted_address;

          setAddressInput(finalStreet);
          setFormData(prev => ({
            ...prev,
            street: finalStreet,
            city: city || '',
            state: state || '',
            zipCode: pinCode || '',
          }));
          setAddressPredictions([]);
        }
      }
    );
  };

  const handleAddressSearch = (value) => {
    setAddressInput(value);
    
    if (!value || !placesService) {
      setAddressPredictions([]);
      return;
    }

    placesService.autocomplete.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'IN' },
        types: ['geocode', 'establishment'],
        language: 'en',
        region: 'IN',
      },
      (predictions, status) => {
        if (status === 'OK' && predictions && predictions.length > 0) {
          setAddressPredictions(predictions);
        } else {
          setAddressPredictions([]);
        }
      }
    );
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        return formData.name && formData.email && formData.password && formData.phoneNumber;
      case 1:
        return formData.street && formData.city && formData.state && formData.zipCode;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      setError('');
      setLoading(true);

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
      };

      await register(userData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    'Basic Information',
    'Address Details',
  ];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in={activeStep === 0}>
            <Box sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {formData.password && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPasswordStrengthColor(),
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: 'block',
                      color: getPasswordStrengthColor(),
                    }}
                  >
                    Password Strength: {passwordStrength}%
                  </Typography>
                </Box>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in={activeStep === 1}>
            <Box sx={{ mt: 3 }}>
              {scriptError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {scriptError}
                </Alert>
              )}
              <Autocomplete
                freeSolo
                options={addressPredictions}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : option.description
                }
                value={addressInput}
                inputValue={addressInput}
                onInputChange={(_, newValue, reason) => {
                  if (reason === 'input') {
                    handleAddressSearch(newValue);
                  }
                }}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setAddressInput(newValue);
                    setFormData(prev => ({ ...prev, street: newValue }));
                  } else if (newValue) {
                    handleAddressSelect(newValue);
                  }
                }}
                loading={addressLoading}
                loadingText="Searching addresses..."
                noOptionsText="No addresses found"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="normal"
                    required
                    fullWidth
                    label="Street Address / Locality"
                    name="street"
                    placeholder="Start typing your address..."
                    error={!!scriptError}
                    helperText={scriptError || "Type to search for your address"}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {addressLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <LocationOn sx={{ mt: 0.5, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1">{option.structured_formatting?.main_text}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.structured_formatting?.secondary_text}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="City / District"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city or district name"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Enter state name"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="PIN Code"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit PIN code"
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                }}
                helperText="Enter 6-digit Indian PIN code"
              />
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: { xs: 2, sm: 4, md: 8 },
          p: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 600,
            color: 'primary.main',
            textAlign: 'center',
          }}
        >
          Create Your Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ width: '100%', mb: 4 }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%' }}
        >
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{
                mr: 1,
                '&.Mui-disabled': {
                  opacity: 0,
                },
              }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !validateStep()}
                sx={{
                  minWidth: 120,
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateStep()}
                sx={{
                  minWidth: 100,
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Already have an account? Sign in
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 