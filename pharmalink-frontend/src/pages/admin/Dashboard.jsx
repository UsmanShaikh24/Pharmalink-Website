import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  ShoppingCart as CartIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpwardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn,
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';
import MedicineManagement from './MedicineManagement';
import OrderManagement from './OrderManagement';

// TabPanel component for tab content
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Stat Card component
function StatCard({ title, value, icon, trend }) {
  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #6B8DD6 0%, #8E37D7 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <IconButton sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
            {icon}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ArrowUpwardIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          <Typography variant="body2">
            {trend}% from last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// PharmacyDialog component for adding/editing pharmacies
function PharmacyDialog({ open, handleClose, pharmacy, handleSave }) {
  const [formData, setFormData] = useState(pharmacy || {
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pinCode: '',
    },
    contactNumber: '',
    operatingHours: {
      open: '09:00',
      close: '21:00',
    },
    deliveryRadius: 5,
  });

  const handleChange = (e) => {
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {pharmacy ? 'Edit Pharmacy' : 'Add New Pharmacy'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pharmacy Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="City"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="State"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="PIN Code"
              name="address.pinCode"
              value={formData.address.pinCode}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Delivery Radius (km)"
              name="deliveryRadius"
              type="number"
              value={formData.deliveryRadius}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Opening Time"
              name="operatingHours.open"
              type="time"
              value={formData.operatingHours.open}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Closing Time"
              name="operatingHours.close"
              type="time"
              value={formData.operatingHours.close}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={() => handleSave(formData)} variant="contained">
          {pharmacy ? 'Save Changes' : 'Add Pharmacy'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Dashboard() {
  const [value, setValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openPharmacyDialog, setOpenPharmacyDialog] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalUsers: 0,
    totalOrders: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load pharmacies first
      const pharmaciesResponse = await axiosInstance.get('/api/pharmacies');
      setPharmacies(pharmaciesResponse.data);
      
      // Load users (excluding admins)
      const usersResponse = await axiosInstance.get('/api/auth/users');
      const regularUsers = usersResponse.data.filter(user => user.role !== 'admin');
      
      // Load orders
      const ordersResponse = await axiosInstance.get('/api/orders');
      
      // Update stats
      setStats({
        totalPharmacies: pharmaciesResponse.data.length || 0,
        totalUsers: regularUsers.length || 0,
        totalOrders: ordersResponse.data.length || 0
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please check if you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    // Ensure the value doesn't exceed the number of available tabs (0-2)
    if (newValue >= 0 && newValue <= 2) {
      setValue(newValue);
    }
  };

  const handleEditPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setOpenPharmacyDialog(true);
  };

  const handleSavePharmacy = async (pharmacyData) => {
    try {
      setLoading(true);
      setError(null);
      if (selectedPharmacy) {
        await axiosInstance.put(`/api/pharmacies/${selectedPharmacy._id}`, pharmacyData);
      } else {
        await axiosInstance.post('/api/pharmacies', pharmacyData);
      }
      await loadInitialData();
      setOpenPharmacyDialog(false);
      setSelectedPharmacy(null);
    } catch (err) {
      setError('Failed to save pharmacy');
      console.error('Error saving pharmacy:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePharmacy = async (pharmacyId) => {
    if (window.confirm('Are you sure you want to delete this pharmacy?')) {
      try {
        setLoading(true);
        setError(null);
        await axiosInstance.delete(`/api/pharmacies/${pharmacyId}`);
        await loadInitialData();
      } catch (err) {
        setError('Failed to delete pharmacy');
        console.error('Error deleting pharmacy:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Admin Dashboard
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Pharmacies"
              value={stats.totalPharmacies}
              icon={<StoreIcon />}
              trend={12}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<PeopleIcon />}
              trend={8}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={<CartIcon />}
              trend={15}
            />
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 4, borderRadius: 2, boxShadow: theme.shadows[3] }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
              },
            }}
          >
            <Tab icon={<StoreIcon />} label="Pharmacies" iconPosition="start" />
            <Tab icon={<PeopleIcon />} label="Medicines" iconPosition="start" />
            <Tab icon={<CartIcon />} label="Orders" iconPosition="start" /> 
          </Tabs>

          {/* Tab Content */}
          <TabPanel value={value} index={0}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">Pharmacies Management</Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {pharmacies.map((pharmacy) => (
                  <Grid item xs={12} sm={6} md={4} key={pharmacy._id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">{pharmacy.name}</Typography>
                          <Box>
                            <IconButton onClick={() => handleEditPharmacy(pharmacy)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeletePharmacy(pharmacy._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {pharmacy.address.street}, {pharmacy.address.city}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Operating Hours: {pharmacy.operatingHours.open} - {pharmacy.operatingHours.close}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
          <TabPanel value={value} index={1}>
            <MedicineManagement />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <OrderManagement />
          </TabPanel>
        </Paper>
      </Container>

      {/* Pharmacy Dialog */}
      <PharmacyDialog
        open={openPharmacyDialog}
        handleClose={() => {
          setOpenPharmacyDialog(false);
          setSelectedPharmacy(null);
        }}
        pharmacy={selectedPharmacy}
        handleSave={handleSavePharmacy}
      />
    </Box>
  );
} 