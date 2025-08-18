import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';


const PharmacyManagement = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [serverStatus, setServerStatus] = useState('checking');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    licenseNumber: '',
    contactNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pinCode: ''
    },
    operatingHours: {
      open: '09:00',
      close: '21:00'
    },
    deliveryRadius: 5
  });

  // Add form validation state
  const [touched, setTouched] = useState({
    name: false,
    licenseNumber: false,
    email: false,
    contactNumber: false,
    address: false,
    pinCode: false
  });

  // Handle field blur for validation
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Validation helper
  const getFieldError = (field) => {
    if (!touched[field]) return '';
    
    switch (field) {
      case 'name':
        return !formData.name ? 'Pharmacy name is required' : '';
      case 'licenseNumber':
        return !formData.licenseNumber ? 'License number is required' : '';
      case 'email':
        return !formData.email 
          ? 'Email is required' 
          : !/\S+@\S+\.\S+/.test(formData.email)
          ? 'Invalid email format'
          : '';
      case 'contactNumber':
        return !formData.contactNumber 
          ? 'Contact number is required' 
          : !/^\d{10}$/.test(formData.contactNumber)
          ? 'Must be a 10-digit number'
          : '';
      case 'pinCode':
        return !formData.address.pinCode 
          ? 'PIN code is required' 
          : !/^\d{6}$/.test(formData.address.pinCode)
          ? 'Must be a 6-digit PIN code'
          : '';
      default:
        return '';
    }
  };



  // Check server connection
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      setServerStatus('checking');
      // Use the pharmacies endpoint to check server status
      await axios.get(`${import.meta.env.VITE_API_URL}/api/pharmacies`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      setServerStatus('connected');
      // If connection is successful, load pharmacies
      loadPharmacies();
    } catch (err) {
      console.error('Server connection error:', err);
      setServerStatus('disconnected');
      showSnackbar('Server connection failed. Please check if the server is running.', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const loadPharmacies = async () => {
    if (serverStatus === 'disconnected') {
      showSnackbar('Cannot load pharmacies: Server is not connected', 'error');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pharmacies`, {
        withCredentials: true,
        headers: getAuthHeaders()
      });
      setPharmacies(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    let errorMessage = `${defaultMessage}. `;
    
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
      
      if (err.response.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Redirect to login page or trigger re-authentication
        window.location.href = '/login';
      } else if (err.response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (err.response.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (err.response.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.data?.errors) {
        // Handle validation errors
        const validationErrors = err.response.data.errors
          .map(error => error.msg)
          .join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      }
    } else if (err.request) {
      errorMessage = 'No response from server. Please check your internet connection.';
    } else {
      errorMessage = 'An unexpected error occurred. Please try again.';
    }
    
    setError(errorMessage);
    showSnackbar(errorMessage, 'error');
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (serverStatus === 'disconnected') {
      showSnackbar('Cannot save pharmacy: Server is not connected', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    // Validate required fields
    const requiredFields = {
      name: formData.name,
      licenseNumber: formData.licenseNumber,
      email: formData.email,
      contactNumber: formData.contactNumber,
      'street address': formData.address.street,
      'PIN code': formData.address.pinCode
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      const errorMessage = `Please fill in required fields: ${missingFields.join(', ')}`;
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      setLoading(false);
      return;
    }

    try {
      const endpoint = selectedPharmacy
        ? `${import.meta.env.VITE_API_URL}/api/pharmacies/${selectedPharmacy._id}`
        : `${import.meta.env.VITE_API_URL}/api/pharmacies`;

      const method = selectedPharmacy ? 'put' : 'post';

      const pharmacyData = {
        ...formData,
        role: 'pharmacy',
        status: 'active'
      };

      const response = await axios({
        method,
        url: endpoint,
        data: pharmacyData,
        withCredentials: true,
        headers: getAuthHeaders()
      });

      if (response.data) {
        const message = selectedPharmacy 
          ? 'Pharmacy updated successfully' 
          : 'Pharmacy added successfully';
        showSnackbar(message, 'success');
        await loadPharmacies();
        handleClose();
      }
    } catch (err) {
      handleApiError(err, 'Failed to save pharmacy');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setFormData({
      ...pharmacy,
      address: {
        ...pharmacy.address,
        pinCode: pharmacy.address.pinCode || ''
      }
    });
    setAddressInput(pharmacy.address.street);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm('Are you sure you want to delete this pharmacy?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/pharmacies/${id}`, {
        withCredentials: true,
        headers: getAuthHeaders()
      });
      
      showSnackbar('Pharmacy deleted successfully', 'success');
      await loadPharmacies();
    } catch (err) {
      handleApiError(err, 'Failed to delete pharmacy');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPharmacy(null);
    setAddressPredictions([]);
    setError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      licenseNumber: '',
      contactNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        pinCode: '',
        coordinates: {
          latitude: null,
          longitude: null
        }
      },
      operatingHours: {
        open: '09:00',
        close: '21:00'
      },
      deliveryRadius: 5
    });
    setAddressInput('');
  };

  if (scriptError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          }
        >
          {scriptError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Manage Pharmacies
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={checkServerConnection}
            color={serverStatus === 'connected' ? 'success' : 'error'}
            disabled={serverStatus === 'checking'}
          >
            {serverStatus === 'checking' ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Checking Server...
              </>
            ) : serverStatus === 'connected' ? (
              'Server Connected'
            ) : (
              'Reconnect Server'
            )}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (serverStatus === 'disconnected') {
                showSnackbar('Cannot add pharmacy: Server is not connected', 'error');
                return;
              }
              setSelectedPharmacy(null);
              setFormData({
                name: '',
                email: '',
                password: '',
                licenseNumber: '',
                contactNumber: '',
                address: {
                  street: '',
                  city: '',
                  state: '',
                  pinCode: '',
                  coordinates: {
                    latitude: null,
                    longitude: null
                  }
                },
                operatingHours: {
                  open: '09:00',
                  close: '21:00'
                },
                deliveryRadius: 5
              });
              setAddressInput('');
              setOpen(true);
            }}
            disabled={serverStatus !== 'connected'}
          >
            Add Pharmacy
          </Button>
        </Box>
      </Box>

      {loading && !open ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pharmacies.map((pharmacy) => (
            <Grid key={pharmacy._id} item xs={12} md={6} lg={4}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {pharmacy.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  License: {pharmacy.licenseNumber}
                </Typography>
                <Typography variant="body2" paragraph>
                  {pharmacy.address.street}
                  <br />
                  {pharmacy.address.city}, {pharmacy.address.state}
                  <br />
                  PIN: {pharmacy.address.pinCode}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleEdit(pharmacy)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(pharmacy._id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPharmacy ? 'Edit Pharmacy' : 'Add New Pharmacy'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Pharmacy Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                  error={touched.name && !!getFieldError('name')}
                  helperText={touched.name && getFieldError('name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="License Number"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  onBlur={() => handleBlur('licenseNumber')}
                  error={touched.licenseNumber && !!getFieldError('licenseNumber')}
                  helperText={touched.licenseNumber && getFieldError('licenseNumber')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => handleBlur('email')}
                  error={touched.email && !!getFieldError('email')}
                  helperText={touched.email && getFieldError('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  onBlur={() => handleBlur('contactNumber')}
                  error={touched.contactNumber && !!getFieldError('contactNumber')}
                  helperText={touched.contactNumber && getFieldError('contactNumber')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter street address"
                  error={!formData.address.street}
                  helperText={!formData.address.street ? 'Street address is required' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter city"
                  error={!formData.address.city}
                  helperText={!formData.address.city ? 'City is required' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter state"
                  error={!formData.address.state}
                  helperText={!formData.address.state ? 'State is required' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PIN Code"
                  value={formData.address.pinCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, pinCode: e.target.value },
                    })
                  }
                  onBlur={() => handleBlur('pinCode')}
                  error={touched.pinCode && !!getFieldError('pinCode')}
                  helperText={touched.pinCode && getFieldError('pinCode')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Delivery Radius (km)"
                  value={formData.deliveryRadius}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryRadius: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  inputProps={{ min: 0, max: 50 }}
                  error={formData.deliveryRadius <= 0}
                  helperText={
                    formData.deliveryRadius <= 0
                      ? 'Delivery radius must be greater than 0'
                      : ''
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Opening Time"
                  value={formData.operatingHours.open}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operatingHours: {
                        ...formData.operatingHours,
                        open: e.target.value,
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Closing Time"
                  value={formData.operatingHours.close}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operatingHours: {
                        ...formData.operatingHours,
                        close: e.target.value,
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  error={formData.operatingHours.close <= formData.operatingHours.open}
                  helperText={
                    formData.operatingHours.close <= formData.operatingHours.open
                      ? 'Closing time must be after opening time'
                      : ''
                  }
                />
              </Grid>
            </Grid>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : selectedPharmacy ? (
              'Save Changes'
            ) : (
              'Add Pharmacy'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PharmacyManagement; 
