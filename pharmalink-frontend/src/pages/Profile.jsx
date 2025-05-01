import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Fab,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Lock,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axios';
import { initGoogleMaps, parseGoogleAddress, loadGoogleMaps } from '../utils/googleMaps';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [addressDialog, setAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const autocompleteRef = useRef(null);
  const googleAutocomplete = useRef(null);
  const [addressInput, setAddressInput] = useState('');
  const [autocompleteInstance, setAutocompleteInstance] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [addressPredictions, setAddressPredictions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const mapRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    phoneNumber: '',
    street: '',
    apartment: '',
    landmark: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'home',
    isDefault: false,
    coordinates: {
      latitude: null,
      longitude: null
    }
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({
    fullName: false,
    phoneNumber: false,
    street: false,
    city: false,
    state: false,
    zipCode: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (addressDialog) {
      if (editingAddress) {
        setAddressFormData({
          fullName: editingAddress.fullName || '',
          phoneNumber: editingAddress.phoneNumber || '',
          street: editingAddress.street || '',
          apartment: editingAddress.apartment || '',
          landmark: editingAddress.landmark || '',
          city: editingAddress.city || '',
          state: editingAddress.state || '',
          zipCode: editingAddress.zipCode || '',
          type: editingAddress.type || 'home',
          isDefault: editingAddress.isDefault || false,
          coordinates: editingAddress.coordinates || { latitude: null, longitude: null }
        });
        setAddressInput(editingAddress.street || '');
      } else {
        setAddressFormData({
          fullName: '',
          phoneNumber: '',
          street: '',
          apartment: '',
          landmark: '',
          city: '',
          state: '',
          zipCode: '',
          type: 'home',
          isDefault: false,
          coordinates: {
            latitude: null,
            longitude: null
          }
        });
        setAddressInput('');
      }
    }
  }, [addressDialog, editingAddress]);

  // Initialize Google Maps API
  useEffect(() => {
    let isMounted = true;

    const initializePlacesService = () => {
      if (!window.google?.maps?.places) {
        setScriptError('Google Maps Places API failed to load');
        return;
      }

      try {
        if (!mapRef.current) {
          mapRef.current = document.createElement('div');
        }

        const autocompleteService = new window.google.maps.places.AutocompleteService();
        const placesService = new window.google.maps.places.PlacesService(mapRef.current);

        if (isMounted) {
          setPlacesService({
            autocomplete: autocompleteService,
            places: placesService
          });
          setScriptLoaded(true);
          setScriptError(null);
        }
      } catch (error) {
        console.error('Error initializing Places service:', error);
        if (isMounted) {
          setScriptError('Failed to initialize Places service');
        }
      }
    };

    const loadMapsLibrary = async () => {
      try {
        await loadGoogleMaps();
        initializePlacesService();
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setScriptError('Failed to load Google Maps. Please check your internet connection.');
      }
    };

    loadMapsLibrary();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  const handleAddressSearch = (value) => {
    if (!placesService?.autocomplete || !value) {
      setAddressPredictions([]);
      return;
    }

    setAddressLoading(true);
    placesService.autocomplete.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'IN' },
        types: ['address']
      },
      (predictions, status) => {
        setAddressLoading(false);
        if (status === 'OK' && predictions && predictions.length > 0) {
          setAddressPredictions(predictions);
        } else {
          setAddressPredictions([]);
        }
      }
    );
  };

  const handleAddressSelect = (prediction) => {
    if (!prediction?.place_id || !placesService?.places) return;

    setAddressLoading(true);
    placesService.places.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry'],
      },
      (place, status) => {
        setAddressLoading(false);
        if (status === 'OK' && place) {
          const addressComponents = place.address_components || [];
          
          // Extract address components for Indian format
          const streetNumber = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
          const route = addressComponents.find(c => c.types.includes('route'))?.long_name || '';
          const sublocality = addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name || '';
          const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
          const city = addressComponents.find(c => 
            c.types.includes('administrative_area_level_2') || 
            c.types.includes('locality')
          )?.long_name || locality || '';
          const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
          const zipCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';

          const street = [streetNumber, route, sublocality].filter(Boolean).join(', ');

          setAddressFormData(prev => ({
            ...prev,
            street: street || '',
            city: city || '',
            state: state || '',
            zipCode: zipCode || '',
            coordinates: place.geometry?.location ? {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng()
            } : null
          }));

          setAddressInput(place.formatted_address || '');
        }
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'phoneNumber':
        return value.length === 10;
      case 'zipCode':
        return value.length === 6;
      case 'fullName':
      case 'street':
      case 'city':
      case 'state':
        return value.trim().length > 0;
      default:
        return true;
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update field error state
    setFieldErrors(prev => ({
      ...prev,
      [name]: !validateField(name, value)
    }));
  };

  const handlePhoneNumberChange = (e) => {
    const { value } = e.target;
    // Only allow numbers and limit to 10 digits
    const phoneNumber = value.replace(/\D/g, '').slice(0, 10);
    setAddressFormData(prev => ({
      ...prev,
      phoneNumber
    }));

    // Update phone number error state
    setFieldErrors(prev => ({
      ...prev,
      phoneNumber: phoneNumber.length !== 10
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.patch('/api/users/profile', formData);
      updateUser(response.data);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      const requiredFields = ['fullName', 'phoneNumber', 'street', 'city', 'state', 'zipCode'];
      const missingFields = requiredFields.filter(field => !addressFormData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      let response;
      const addressData = {
        fullName: addressFormData.fullName,
        phoneNumber: addressFormData.phoneNumber,
        street: addressFormData.street,
        apartment: addressFormData.apartment || '',
        landmark: addressFormData.landmark || '',
        city: addressFormData.city,
        state: addressFormData.state,
        zipCode: addressFormData.zipCode,
        type: addressFormData.type || 'home',
        isDefault: addressFormData.isDefault || false,
        coordinates: addressFormData.coordinates || { latitude: null, longitude: null }
      };

      console.log('Submitting address data:', addressData);

      if (editingAddress) {
        console.log('Updating address:', editingAddress._id);
        response = await axiosInstance.patch(
          `/api/users/addresses/${editingAddress._id}`,
          addressData
        );
      } else {
        console.log('Creating new address');
        response = await axiosInstance.post('/api/users/addresses', addressData);
      }
      
      console.log('API Response:', response.data);
      
      if (response.data) {
        updateUser(response.data);
        setAddressDialog(false);
        setEditingAddress(null);
        toast.success(`Address ${editingAddress ? 'updated' : 'added'} successfully`);
      } else {
        throw new Error('No response data received');
      }
    } catch (err) {
      console.error('Error saving address:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save address';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      console.log('Deleting address:', addressId); // Debug log
      const response = await axiosInstance.delete(`/api/users/addresses/${addressId}`);
      
      console.log('Delete response:', response.data); // Debug log
      
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Address deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete address');
      }
    } catch (err) {
      console.error('Error deleting address:', err); // Debug log
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete address';
      toast.error(errorMessage);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      console.log('Setting default address:', addressId); // Debug log
      const response = await axiosInstance.patch(`/api/users/addresses/${addressId}/set-default`);
      
      console.log('Set default response:', response.data); // Debug log
      
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Default address updated');
      } else {
        throw new Error(response.data.message || 'Failed to update default address');
      }
    } catch (err) {
      console.error('Error setting default address:', err); // Debug log
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update default address';
      toast.error(errorMessage);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate password fields
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('Please fill in all password fields');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        throw new Error(
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
      }

      await axiosInstance.patch('/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password changed successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to change password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Profile
          </Typography>
          <Button
            variant={editMode ? "outlined" : "contained"}
            color={editMode ? "error" : "primary"}
            onClick={() => setEditMode(!editMode)}
            disabled={loading}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!editMode || loading}
                required
                autoComplete="name"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!editMode || loading}
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!editMode || loading}
                required
                autoComplete="tel"
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                {editMode && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>

        <Divider sx={{ my: 4 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Delivery Addresses
          </Typography>
          <Fab
            color="primary"
            size="small"
            onClick={() => {
              setEditingAddress(null);
              setAddressDialog(true);
            }}
          >
            <AddIcon />
          </Fab>
        </Box>

        <Grid container spacing={2}>
          {user?.addresses?.map((address) => (
            <Grid item xs={12} md={6} key={address._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" gutterBottom>
                      {address.fullName}
                    </Typography>
                    <IconButton
                      size="small"
                      color={address.isDefault ? "primary" : "default"}
                      onClick={() => handleSetDefaultAddress(address._id)}
                    >
                      {address.isDefault ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {address.phoneNumber}
                  </Typography>
                  <Typography variant="body2">
                    {[
                      address.street,
                      address.apartment,
                      address.landmark,
                      address.city,
                      address.state,
                      address.zipCode
                    ].filter(Boolean).join(', ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditingAddress(address);
                      setAddressDialog(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteAddress(address._id)}
                    disabled={address.isDefault}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setPasswordDialog(true)}
            startIcon={<Lock />}
          >
            Change Password
          </Button>
        </Box>
      </Paper>

      {/* Address Dialog */}
      <Dialog
        open={addressDialog}
        onClose={() => {
          setAddressDialog(false);
          setEditingAddress(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Box 
            component="form" 
            onSubmit={handleAddressSubmit} 
            sx={{ mt: 2 }}
            autoComplete="on"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={addressFormData.fullName}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter full name"
                  error={fieldErrors.fullName}
                  helperText={fieldErrors.fullName ? "Full name is required" : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="phoneNumber"
                  value={addressFormData.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                  placeholder="Enter 10-digit mobile number"
                  error={fieldErrors.phoneNumber}
                  helperText={fieldErrors.phoneNumber ? "Phone number must be 10 digits" : ""}
                  inputProps={{
                    maxLength: 10,
                    pattern: '[0-9]*'
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                {scriptError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {scriptError}
                  </Alert>
                ) : (
                  <Autocomplete
                    freeSolo
                    options={addressPredictions}
                    getOptionLabel={(option) => 
                      typeof option === 'string' ? option : option.description
                    }
                    inputValue={addressInput}
                    onInputChange={(event, value) => {
                      setAddressInput(value);
                      handleAddressSearch(value);
                    }}
                    onChange={(event, value) => {
                      if (value && typeof value !== 'string') {
                        handleAddressSelect(value);
                      }
                    }}
                    loading={addressLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Search Address"
                        placeholder="Start typing your address..."
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: 'text.secondary' }} />
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
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Apartment/Suite/Floor"
                  name="apartment"
                  value={addressFormData.apartment}
                  onChange={handleAddressInputChange}
                  placeholder="Enter apartment, suite, or floor number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Landmark"
                  name="landmark"
                  value={addressFormData.landmark}
                  onChange={handleAddressInputChange}
                  placeholder="Enter a nearby landmark (optional)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={addressFormData.city}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter city"
                  error={fieldErrors.city}
                  helperText={fieldErrors.city ? "City is required" : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={addressFormData.state}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter state"
                  error={fieldErrors.state}
                  helperText={fieldErrors.state ? "State is required" : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  name="zipCode"
                  value={addressFormData.zipCode}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter 6-digit PIN code"
                  error={fieldErrors.zipCode}
                  helperText={fieldErrors.zipCode ? "ZIP code must be 6 digits" : ""}
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*'
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Address Type"
                  name="type"
                  value={addressFormData.type}
                  onChange={handleAddressInputChange}
                  required
                >
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addressFormData.isDefault}
                      onChange={(e) => setAddressFormData(prev => ({
                        ...prev,
                        isDefault: e.target.checked
                      }))}
                      name="isDefault"
                    />
                  }
                  label="Set as default address"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddressDialog(false);
              setEditingAddress(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddressSubmit}
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingAddress ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              autoComplete="current-password"
            />
            <TextField
              fullWidth
              margin="normal"
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              autoComplete="new-password"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              autoComplete="new-password"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 