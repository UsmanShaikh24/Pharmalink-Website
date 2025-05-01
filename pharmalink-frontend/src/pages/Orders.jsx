import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Cancel,
  Pending,
  ShoppingCart,
  LocalPharmacy
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';

const orderStatuses = [
  { label: 'Placed', icon: <ShoppingCart /> },
  { label: 'Confirmed', icon: <CheckCircle /> },
  { label: 'Processing', icon: <LocalPharmacy /> },
  { label: 'Out for Delivery', icon: <LocalShipping /> },
  { label: 'Delivered', icon: <CheckCircle /> }
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await axiosInstance.get('/api/orders/user');
      console.log('Orders response:', response.data);
      // Sort orders by createdAt date in descending order (most recent first)
      const sortedOrders = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.error || 'Failed to load orders');
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    if (status === 'cancelled') return -1;
    return orderStatuses.findIndex(s => s.label.toLowerCase() === status.toLowerCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'info';
      case 'out for delivery':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">You haven't placed any orders yet.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>
      
      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order._id}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </Typography>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Order Items */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Items:
                    </Typography>
                    {order.items.map((item, index) => (
                      <Box key={index} mb={1}>
                        <Typography variant="body2">
                          {item.medicineId?.name || 'Medicine'} x {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Order Details */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Ordered on: {formatDate(order.createdAt)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Delivery Type: {order.deliveryType}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Payment Method: {order.paymentMethod.toUpperCase()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Delivery Address:
                    </Typography>
                    <Typography variant="body2">
                      {order.deliveryAddress.street},
                      {order.deliveryAddress.city},
                      {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" align="right">
                      Total: ₹{order.totalAmount.toFixed(2)}
                    </Typography>
                    {(order.tax > 0 || order.deliveryFee > 0) && (
                      <Box mt={1}>
                        <Typography variant="body2" color="textSecondary" align="right">
                          Subtotal: ₹{(order.subtotal || 0).toFixed(2)}
                        </Typography>
                        {order.tax > 0 && (
                          <Typography variant="body2" color="textSecondary" align="right">
                            Tax: ₹{order.tax.toFixed(2)}
                          </Typography>
                        )}
                        {order.deliveryFee > 0 && (
                          <Typography variant="body2" color="textSecondary" align="right">
                            Delivery Fee: ₹{order.deliveryFee.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Grid>

                  {/* Order Status Stepper */}
                  {order.status !== 'cancelled' && (
                    <Grid item xs={12}>
                      <Stepper activeStep={getStatusIndex(order.status)} alternativeLabel>
                        {orderStatuses.map((status) => (
                          <Step key={status.label}>
                            <StepLabel StepIconComponent={() => status.icon}>
                              {status.label}
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Orders; 