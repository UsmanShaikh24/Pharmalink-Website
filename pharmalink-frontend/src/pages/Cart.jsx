import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Divider,
  TextField,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  Snackbar,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  LocalShipping,
  Timer,
  Payment as PaymentIcon,
  LocalPharmacy,
  LocationOn,
  Home as HomeIcon,
  Work as WorkIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import CheckoutLogin from '../components/CheckoutLogin';

const deliveryOptions = [
  {
    id: 'emergency',
    label: 'Emergency Delivery (10 minutes)',
    price: 9.99,
    icon: <Timer />,
  },
  {
    id: 'standard',
    label: 'Standard Delivery (30-45 minutes)',
    price: 4.99,
    icon: <LocalShipping />,
  },
];

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    houseNumber: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const [touched, setTouched] = useState({
    fullName: false,
    houseNumber: false,
    street: false,
    landmark: false,
    city: false,
    state: false,
    zipCode: false,
    phone: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();



  useEffect(() => {
    // Set default address if available and only if no address is currently selected
    if (user?.addresses?.length > 0 && !selectedSavedAddress) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      setSelectedSavedAddress(defaultAddress);
      setDeliveryAddress({
        fullName: defaultAddress.fullName || '',
        houseNumber: defaultAddress.apartment || '',
        street: defaultAddress.street || '',
        landmark: defaultAddress.landmark || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        zipCode: defaultAddress.zipCode || '',
        phone: defaultAddress.phoneNumber || ''
      });
    } else if (!user?.addresses?.length) {
      // Reset form if no saved addresses
      setDeliveryAddress({
        fullName: '',
        houseNumber: '',
        street: '',
        landmark: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
      });
    }
  }, [user]);

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon />;
      case 'work':
        return <WorkIcon />;
      default:
        return <PlaceIcon />;
    }
  };

  const handleSavedAddressSelect = (address) => {
    setSelectedSavedAddress(address);
    setDeliveryAddress({
      fullName: address.fullName || '',
      houseNumber: address.apartment || '',
      street: address.street || '',
      landmark: address.landmark || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      phone: address.phoneNumber || ''
    });
    setShowNewAddressForm(false);
  };

  const handleNewAddressClick = () => {
    setShowNewAddressForm(true);
    setSelectedSavedAddress(null);
    setDeliveryAddress({
      fullName: '',
      houseNumber: '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      zipCode: '',
      phone: ''
    });
  };



  const steps = ['Cart Review', 'Delivery Address', 'Delivery Options', 'Payment'];

  const handleQuantityChange = (id, change) => {
    updateQuantity(id, change);
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  const calculateSubtotal = () => {
    return getCartTotal();
  };

  const getDeliveryFee = () => {
    const option = deliveryOptions.find(opt => opt.id === deliveryOption);
    return option ? option.price : 0;
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const deliveryFee = getDeliveryFee();
    return subtotal + tax + deliveryFee;
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddressChange = (field) => (event) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const validateAddress = () => {
    const required = ['fullName', 'houseNumber', 'street', 'city', 'state', 'zipCode', 'phone'];
    return required.every(field => deliveryAddress[field]?.trim());
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!validateAddress()) {
        setError('Please fill in all delivery details');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Debug logging
      console.log('Token:', token);
      console.log('User:', user);
      console.log('Cart items:', cartItems);
      console.log('Delivery address:', deliveryAddress);
      
      if (!token) {
        setError('Please login to place an order');
        return;
      }

      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const deliveryFee = getDeliveryFee();
      const totalAmount = calculateTotal();
      
      const orderData = {
        items: cartItems.map(item => ({
          medicineId: item.id,
          quantity: item.quantity
        })),
        deliveryType: deliveryOption,
        deliveryAddress: {
          street: `${deliveryAddress.houseNumber}, ${deliveryAddress.street}`,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zipCode: deliveryAddress.zipCode,
          coordinates: {
            latitude: 0, // Default coordinates since we removed Google Maps
            longitude: 0
          }
        },
        tax: tax,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount,
        paymentMethod: 'cod'
      };

      console.log('Order data being sent:', orderData);

      const response = await axios.post('https://pharmalink-website.onrender.com/api/orders', orderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Clear cart after successful order
      clearCart();
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Order placed successfully! Redirecting to orders page...',
        severity: 'success'
      });

      // Navigate to orders page after a short delay
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderCartItems = () => {
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {cartItems.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3} sm={2}>
                        <Box
                          sx={{
                            height: 100,
                            bgcolor: (theme) => theme.palette.primary.light + '15',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" align="center" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={9} sm={4}>
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.brand}
                        </Typography>
                        {item.prescription && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            Prescription required
                          </Alert>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            size="small"
                            icon={<LocalPharmacy />}
                            label={item.pharmacy.name}
                            color="primary"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            size="small"
                            value={item.quantity}
                            InputProps={{
                              readOnly: true,
                              sx: { width: '60px', textAlign: 'center' },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="h6" color="primary">
                      ₹{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={2} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Subtotal</Typography>
                  <Typography>₹{calculateSubtotal().toFixed(2)}</Typography>
                    </Grid>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Tax (10%)</Typography>
                  <Typography>₹{calculateTax(calculateSubtotal()).toFixed(2)}</Typography>
                </Grid>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Delivery Fee</Typography>
                  <Typography>₹{getDeliveryFee().toFixed(2)}</Typography>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Grid container justifyContent="space-between">
                      <Typography variant="h6">Total</Typography>
                      <Typography variant="h6" color="primary">
                    ₹{calculateTotal().toFixed(2)}
                      </Typography>
                    </Grid>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleNext}
                    sx={{ mt: 2 }}
                    disabled={cartItems.length === 0}
                  >
                    {user ? 'Continue to Delivery' : 'Login to Continue'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/search')}
                    sx={{ mt: 2 }}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
  };

  const renderAddressStep = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {user?.addresses?.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Saved Addresses
                </Typography>
                <List>
                  {user.addresses.map((address) => (
                    <ListItem
                      key={address._id}
                      sx={{
                        border: '1px solid',
                        borderColor: selectedSavedAddress?._id === address._id ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSavedAddressSelect(address)}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn />
                            <Typography component="span" variant="subtitle1">
                              {address.fullName} {address.isDefault && (
                                <Chip size="small" color="primary" label="Default" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Typography component="span" variant="body2" color="text.secondary" display="block">
                              {[
                                address.street,
                                address.apartment,
                                address.landmark,
                                address.city,
                                address.state,
                                address.zipCode
                              ].filter(Boolean).join(', ')}
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary" display="block">
                              Phone: {address.phoneNumber}
                            </Typography>
                          </Box>
                        }
                      />
                      <Radio
                        checked={selectedSavedAddress?._id === address._id}
                        onChange={() => handleSavedAddressSelect(address)}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant={!selectedSavedAddress ? "contained" : "outlined"}
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedSavedAddress(null);
                    setDeliveryAddress({
                      fullName: '',
                      houseNumber: '',
                      street: '',
                      landmark: '',
                      city: '',
                      state: '',
                      zipCode: '',
                      phone: ''
                    });
                  }}
                  sx={{ mt: 2, mb: 3 }}
                >
                  Add New Address
                </Button>

                <Divider sx={{ my: 2 }} />
              </>
            )}

            {(!user?.addresses?.length || !selectedSavedAddress) && (
              <>
                <Typography variant="h6" gutterBottom>
                  {user?.addresses?.length > 0 ? 'Add New Address' : 'Delivery Address'}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={deliveryAddress.fullName || ''}
                      onChange={handleAddressChange('fullName')}
                      onBlur={handleBlur('fullName')}
                      required
                      error={touched.fullName && !deliveryAddress.fullName?.trim()}
                      helperText={touched.fullName && !deliveryAddress.fullName?.trim() ? 'Full name is required' : ''}
                      placeholder="Enter your full name"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="House/Flat/Block No."
                      value={deliveryAddress.houseNumber}
                      onChange={handleAddressChange('houseNumber')}
                      onBlur={handleBlur('houseNumber')}
                      required
                      error={touched.houseNumber && !deliveryAddress.houseNumber.trim()}
                      helperText={touched.houseNumber && !deliveryAddress.houseNumber.trim() ? 'House/Flat/Block No. is required' : ''}
                      placeholder="Enter your house/flat/block number"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      value={deliveryAddress.street}
                      onChange={handleAddressChange('street')}
                      onBlur={handleBlur('street')}
                      required
                      error={touched.street && !deliveryAddress.street.trim()}
                      helperText={touched.street && !deliveryAddress.street.trim() ? 'Street address is required' : 'Enter your street address'}
                      placeholder="Enter your street address"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Landmark (Optional)"
                      value={deliveryAddress.landmark}
                      onChange={handleAddressChange('landmark')}
                      onBlur={handleBlur('landmark')}
                      placeholder="Enter a nearby landmark for easier delivery"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={deliveryAddress.city}
                      onChange={handleAddressChange('city')}
                      onBlur={handleBlur('city')}
                      required
                      error={touched.city && !deliveryAddress.city.trim()}
                      helperText={touched.city && !deliveryAddress.city.trim() ? 'City is required' : ''}
                      placeholder="Enter your city"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="State"
                      value={deliveryAddress.state}
                      onChange={handleAddressChange('state')}
                      onBlur={handleBlur('state')}
                      required
                      error={touched.state && !deliveryAddress.state.trim()}
                      helperText={touched.state && !deliveryAddress.state.trim() ? 'State is required' : ''}
                      placeholder="Enter your state"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="PIN Code"
                      value={deliveryAddress.zipCode}
                      onChange={handleAddressChange('zipCode')}
                      onBlur={handleBlur('zipCode')}
                      required
                      error={touched.zipCode && !deliveryAddress.zipCode.trim()}
                      helperText={touched.zipCode && !deliveryAddress.zipCode.trim() ? 'PIN code is required' : ''}
                      placeholder="Enter 6-digit PIN code"
                      inputProps={{
                        maxLength: 6,
                        pattern: '[0-9]*'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={deliveryAddress.phone}
                      onChange={handleAddressChange('phone')}
                      onBlur={handleBlur('phone')}
                      required
                      error={touched.phone && !deliveryAddress.phone.trim()}
                      helperText={touched.phone && !deliveryAddress.phone.trim() ? 'Phone number is required' : ''}
                      placeholder="Enter 10-digit mobile number"
                      inputProps={{
                        maxLength: 10,
                        pattern: '[0-9]*'
                      }}
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box sx={{ my: 2 }}>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Subtotal</Typography>
                  <Typography>₹{calculateSubtotal().toFixed(2)}</Typography>
                </Grid>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Delivery Fee</Typography>
                  <Typography>₹{getDeliveryFee().toFixed(2)}</Typography>
                </Grid>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Tax (10%)</Typography>
                  <Typography>₹{calculateTax(calculateSubtotal()).toFixed(2)}</Typography>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Grid container justifyContent="space-between">
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{calculateTotal().toFixed(2)}
                  </Typography>
                </Grid>
              </Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={handleNext}
                sx={{ mt: 2 }}
                disabled={!validateAddress()}
              >
                Continue to Delivery Options
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleBack}
                sx={{ mt: 2 }}
              >
                Back to Cart
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderDeliveryOptions = () => {
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Select Delivery Option
                </Typography>
                <RadioGroup
                  value={deliveryOption}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                >
                  {deliveryOptions.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {option.icon}
                          <Box>
                            <Typography>{option.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                          Delivery Fee: ₹{option.price.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ mb: 2 }}
                    />
                  ))}
                </RadioGroup>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Subtotal</Typography>
                  <Typography>₹{calculateSubtotal().toFixed(2)}</Typography>
                    </Grid>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Delivery Fee</Typography>
                  <Typography>₹{getDeliveryFee().toFixed(2)}</Typography>
                    </Grid>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Tax (10%)</Typography>
                  <Typography>₹{calculateTax(calculateSubtotal()).toFixed(2)}</Typography>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Grid container justifyContent="space-between">
                      <Typography variant="h6">Total</Typography>
                      <Typography variant="h6" color="primary">
                    ₹{calculateTotal().toFixed(2)}
                      </Typography>
                    </Grid>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleNext}
                    sx={{ mt: 2 }}
                  >
                    Continue to Payment
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                  >
                Back to Address
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
  };

  const renderOrderSummary = () => {
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Payment Method
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Cash on Delivery (COD) is currently the only available payment option
                </Alert>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PaymentIcon color="primary" />
                  <Typography>Cash on Delivery</Typography>
                </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Subtotal</Typography>
                  <Typography>₹{calculateSubtotal().toFixed(2)}</Typography>
                    </Grid>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Delivery Fee</Typography>
                  <Typography>₹{getDeliveryFee().toFixed(2)}</Typography>
                    </Grid>
                    <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography>Tax (10%)</Typography>
                  <Typography>₹{calculateTax(calculateSubtotal()).toFixed(2)}</Typography>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Grid container justifyContent="space-between">
                      <Typography variant="h6">Total</Typography>
                      <Typography variant="h6" color="primary">
                    ₹{calculateTotal().toFixed(2)}
                      </Typography>
                    </Grid>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleCheckout}
                disabled={loading}
                    sx={{ mt: 2 }}
                  >
                {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                disabled={loading}
                  >
                    Back to Delivery
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
  };

  const renderStepContent = (step) => {
    // Check if user is authenticated when trying to proceed to checkout steps
    if (step > 0 && !user) {
      return (
        <CheckoutLogin
          onProceedToLogin={() => {
            navigate('/login', { 
              state: { 
                from: '/cart',
                message: 'Please login to complete your order'
              } 
            });
          }}
          cartItemsCount={cartItems.length}
          totalAmount={calculateTotal()}
        />
      );
    }

    switch (step) {
      case 0:
        return renderCartItems();
      case 1:
        return renderAddressStep();
      case 2:
        return renderDeliveryOptions();
      case 3:
        return renderOrderSummary();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CartIcon /> Shopping Cart
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {cartItems.length === 0 && activeStep === 0 ? (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/search')}
                sx={{ mt: 2 }}
              >
                Continue Shopping
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        renderStepContent(activeStep)
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart; 
