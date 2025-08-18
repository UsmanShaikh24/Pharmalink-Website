import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Alert,
  Container,
  Grid,
  Paper
} from '@mui/material';
import {
  Lock as LockIcon,
  ShoppingCart as CartIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Person as GuestIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CheckoutLogin = ({ onProceedToLogin, cartItemsCount, totalAmount }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login', { 
      state: { 
        from: '/cart',
        message: 'Please login to complete your order'
      } 
    });
  };

  const handleRegister = () => {
    navigate('/register', { 
      state: { 
        from: '/cart',
        message: 'Create an account to complete your order'
      } 
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LockIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Login Required for Checkout
            </Typography>
            <Typography variant="body1" color="text.secondary">
              To complete your order and ensure secure delivery, please login to your account or create a new one.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Benefits of logging in:</strong> Track orders, save addresses, view order history, and get personalized recommendations.
            </Typography>
          </Alert>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Existing User?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sign in to your account to continue
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleLogin}
                    startIcon={<LoginIcon />}
                  >
                    Login
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', border: '2px solid', borderColor: 'secondary.main' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <RegisterIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    New User?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create an account in just a few steps
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    onClick={handleRegister}
                    startIcon={<RegisterIcon />}
                  >
                    Register
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={() => navigate('/search')}
              startIcon={<CartIcon />}
            >
              Continue Shopping
            </Button>
          </Box>

          {/* Order Summary Preview */}
          <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Items in cart:</Typography>
              <Typography>{cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Total amount:</Typography>
              <Typography variant="h6" color="primary">
                ₹{totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CheckoutLogin;
