import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axiosInstance from '../../utils/axios';

// Status chip component with appropriate colors
const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'out-for-delivery': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      color={getStatusColor(status)}
      size="small"
    />
  );
};

// Order details dialog component
const OrderDetailsDialog = ({ open, handleClose, order, handleStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);
    }
  }, [order]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await handleStatusUpdate(order._id, newStatus);
      handleClose();
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Order Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Order ID</Typography>
            <Typography variant="body1">{order._id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Customer</Typography>
            <Typography variant="body1">{order.userId?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Pharmacy</Typography>
            <Typography variant="body1">{order.pharmacyId?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Total Amount</Typography>
            <Typography variant="body1">₹{order.totalAmount}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Delivery Address</Typography>
            <Typography variant="body1">
              {`${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zipCode}`}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Items</Typography>
            {order.items.map((item, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {item.medicineId?.name || 'N/A'} - Qty: {item.quantity} - ₹{item.price}
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Order Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={loading}
            >
              {['pending', 'confirmed', 'processing', 'out-for-delivery', 'delivered', 'cancelled'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
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
          disabled={loading || newStatus === order.status}
        >
          {loading ? <CircularProgress size={24} /> : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/orders');
      
      if (!response?.data) {
        throw new Error('No data received from server');
      }

      // Ensure we have an array of orders
      const orders = Array.isArray(response.data) ? response.data : [];
      
      // Set orders directly
      setOrders(orders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders. Please check if you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await axiosInstance.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      await loadOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(searchTermLower) ||
      (order.userId?.name || '').toLowerCase().includes(searchTermLower) ||
      (order.pharmacyId?.name || '').toLowerCase().includes(searchTermLower) ||
      order.status.toLowerCase().includes(searchTermLower)
    );
  });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
          size="small"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="contained" 
          color="primary"
          onClick={loadOrders}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Refresh'}
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Pharmacy</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id}</TableCell>
                  <TableCell>
                    {order.userId ? `${order.userId.name} (${order.userId.email})` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {order.pharmacyId ? `${order.pharmacyId.name} - ${order.pharmacyId.address?.city || 'N/A'}` : 'N/A'}
                  </TableCell>
                  <TableCell>₹{Number(order.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusChip status={order.status || 'pending'} />
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleViewDetails(order)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredOrders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <OrderDetailsDialog
        open={openDialog}
        handleClose={() => {
          setOpenDialog(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        handleStatusUpdate={handleStatusUpdate}
      />
    </Box>
  );
} 