import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Alert,
  Chip,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format, isValid, parseISO } from 'date-fns';

// Configure axios
axios.defaults.baseURL = 'https://pharmalink-website.onrender.com';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    description: '',
    category: '',
    dosageForm: '',
    strength: { value: '', unit: '' },
    price: '',
    stock: {
      currentQuantity: '',
      minThreshold: '',
      unit: ''
    },
    expiryDate: '',
    batchNumber: '',
    requiresPrescription: false,
    pharmacyId: ''
  });
  const [touched, setTouched] = useState({});
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);

  const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Other'];
  const stockUnits = ['Strips', 'Bottles', 'Units', 'Boxes'];
  const strengthUnits = ['mg', 'ml', 'g', 'mcg', 'IU'];

  useEffect(() => {
    loadPharmacies();
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [page, rowsPerPage, search, selectedPharmacy]);

  const loadPharmacies = async () => {
    try {
      const response = await axios.get('/api/pharmacies');
      setPharmacies(response.data);
    } catch (err) {
      setError('Failed to load pharmacies');
    }
  };

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Debug log for request parameters
      console.log('Request params:', {
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        pharmacyId: selectedPharmacy || undefined
      });

      const response = await axios.get('/api/medicines/admin', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
          pharmacyId: selectedPharmacy || undefined
        }
      });
      
      console.log('Medicines response:', response.data);
      console.log('Selected pharmacy:', selectedPharmacy);
      
      if (response.data && Array.isArray(response.data.medicines)) {
        setMedicines(response.data.medicines);
        setTotalMedicines(response.data.totalItems);
      } else {
        console.error('Invalid response format:', response.data);
        setMedicines([]);
        setTotalMedicines(0);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
      setError(err.response?.data?.message || 'Failed to load medicines');
      setMedicines([]);
      setTotalMedicines(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldTouch = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitAttempted(true);
    setError('');
    
    try {
      // Validate required fields first
      const requiredFields = [
        'name',
        'genericName',
        'manufacturer',
        'category',
        'dosageForm',
        'pharmacyId',
        'price',
        'batchNumber',
        'expiryDate'
      ];

      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Format the data according to the backend requirements
      const medicineData = {
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        manufacturer: formData.manufacturer.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        dosageForm: formData.dosageForm,
        pharmacyId: formData.pharmacyId,
        price: parseFloat(formData.price),
        stock: {
          currentQuantity: parseInt(formData.stock.currentQuantity),
          minThreshold: parseInt(formData.stock.minThreshold),
          unit: formData.stock.unit
        },
        expiryDate: new Date(formData.expiryDate).toISOString(),
        batchNumber: formData.batchNumber.trim(),
        requiresPrescription: Boolean(formData.requiresPrescription),
        strength: formData.strength
      };

      // Additional validations
      if (isNaN(medicineData.price) || medicineData.price <= 0) {
        setError('Price must be a valid number greater than 0');
        return;
      }

      if (isNaN(medicineData.stock.currentQuantity) || medicineData.stock.currentQuantity < 0) {
        setError('Stock quantity must be a valid non-negative number');
        return;
      }

      if (isNaN(medicineData.stock.minThreshold) || medicineData.stock.minThreshold < 0) {
        setError('Minimum threshold must be a valid non-negative number');
        return;
      }

      const expiryDate = new Date(medicineData.expiryDate);
      if (!isValid(expiryDate) || expiryDate <= new Date()) {
        setError('Please select a valid future date for expiry');
        return;
      }

      console.log('Submitting medicine data:', medicineData);

      const response = selectedMedicine
        ? await axios.put(`/api/medicines/${selectedMedicine._id}`, medicineData)
        : await axios.post('/api/medicines', medicineData);

      console.log('Server response:', response.data);
      handleClose();
      loadMedicines();
      alert(selectedMedicine ? 'Medicine updated successfully' : 'Medicine added successfully');
    } catch (err) {
      console.error('Error saving medicine:', err);
      if (err.response?.data?.errors) {
        const errorMessages = Array.isArray(err.response.data.errors)
          ? err.response.data.errors.map(error => error.msg || error.message).join('\n')
          : Object.values(err.response.data.errors).join('\n');
        setError(`Validation errors:\n${errorMessages}`);
      } else {
        setError(err.response?.data?.message || 'Failed to save medicine. Please try again.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await axios.delete(`/api/medicines/${id}`);
        loadMedicines();
      } catch (err) {
        setError('Failed to delete medicine');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const parsedDate = parseISO(date);
    return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy') : '';
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      ...medicine,
      expiryDate: medicine.expiryDate ? format(parseISO(medicine.expiryDate), 'yyyy-MM-dd') : '',
      pharmacyId: medicine.pharmacy?._id || '' // Use pharmacy._id for editing
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMedicine(null);
    setError('');
    setTouched({});
    setIsSubmitAttempted(false);
    setFormData({
      name: '',
      genericName: '',
      manufacturer: '',
      description: '',
      category: '',
      dosageForm: '',
      pharmacyId: '',
      strength: { value: '', unit: '' },
      price: '',
      stock: {
        currentQuantity: '',
        minThreshold: '',
        unit: ''
      },
      expiryDate: '',
      batchNumber: '',
      requiresPrescription: false
    });
  };

  const handleStockUpdate = async (id, operation, quantity) => {
    try {
      await axios.patch(`/api/medicines/${id}/stock`, {
        operation,
        quantity: parseInt(quantity)
      });
      loadMedicines();
    } catch (err) {
      setError('Failed to update stock');
    }
  };

  const getPharmacyName = (pharmacy) => {
    if (!pharmacy || typeof pharmacy !== 'object' || !pharmacy.name) {
      return 'Unknown Pharmacy';
    }
    return pharmacy.name;
  };

  // Function to determine if field should show error
  const shouldShowError = (field) => {
    return (touched[field] || isSubmitAttempted) && !formData[field];
  };

  const shouldShowStockError = (field) => {
    return (touched[`stock.${field}`] || isSubmitAttempted) && !formData.stock[field];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Medicine Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Total Medicines: {totalMedicines}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Medicine
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            sx={{ flex: 1 }}
            variant="outlined"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Pharmacy</InputLabel>
            <Select
              value={selectedPharmacy}
              onChange={(e) => {
                console.log('Selected pharmacy value:', e.target.value);
                setSelectedPharmacy(e.target.value);
                setPage(0); // Reset to first page when changing pharmacy
              }}
              label="Filter by Pharmacy"
            >
              <MenuItem value="">All Pharmacies</MenuItem>
              {pharmacies.map((pharmacy) => (
                <MenuItem key={pharmacy._id} value={pharmacy._id}>
                  {pharmacy.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Pharmacy</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine._id}>
                  <TableCell>
                    <Typography variant="subtitle2">{medicine.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {medicine.genericName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StoreIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {getPharmacyName(medicine.pharmacy)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{medicine.category}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {medicine.stock.currentQuantity} {medicine.stock.unit}
                      {medicine.stock.currentQuantity <= medicine.stock.minThreshold && (
                        <Tooltip title="Low Stock">
                          <WarningIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>₹{medicine.price}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formatDate(medicine.expiryDate)}
                      {medicine.expiryDate && new Date(medicine.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <Tooltip title="Expiring Soon">
                          <TimeIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(medicine)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(medicine._id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalMedicines} // Use totalMedicines instead of medicines.length
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedMedicine ? 'Edit Medicine' : 'Add New Medicine'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError('')}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={shouldShowError('pharmacyId')}>
                  <InputLabel>Select Pharmacy</InputLabel>
                  <Select
                    value={formData.pharmacyId}
                    onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value })}
                    onBlur={() => handleFieldTouch('pharmacyId')}
                    label="Select Pharmacy"
                  >
                    {pharmacies.map((pharmacy) => (
                      <MenuItem key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Medicine Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => handleFieldTouch('name')}
                  required
                  error={shouldShowError('name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Generic Name"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  onBlur={() => handleFieldTouch('genericName')}
                  required
                  error={shouldShowError('genericName')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  onBlur={() => handleFieldTouch('manufacturer')}
                  required
                  error={shouldShowError('manufacturer')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  onBlur={() => handleFieldTouch('category')}
                  required
                  error={shouldShowError('category')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={shouldShowError('dosageForm')}>
                  <InputLabel>Dosage Form</InputLabel>
                  <Select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    onBlur={() => handleFieldTouch('dosageForm')}
                    label="Dosage Form"
                  >
                    {dosageForms.map((form) => (
                      <MenuItem key={form} value={form}>
                        {form}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  onBlur={() => handleFieldTouch('price')}
                  required
                  error={shouldShowError('price')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Current Stock"
                  value={formData.stock.currentQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: { ...formData.stock, currentQuantity: e.target.value }
                    })
                  }
                  onBlur={() => handleFieldTouch('stock.currentQuantity')}
                  required
                  error={shouldShowStockError('currentQuantity')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Min Threshold"
                  value={formData.stock.minThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: { ...formData.stock, minThreshold: e.target.value }
                    })
                  }
                  onBlur={() => handleFieldTouch('stock.minThreshold')}
                  required
                  error={shouldShowStockError('minThreshold')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required error={shouldShowStockError('unit')}>
                  <InputLabel>Stock Unit</InputLabel>
                  <Select
                    value={formData.stock.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: { ...formData.stock, unit: e.target.value }
                      })
                    }
                    onBlur={() => handleFieldTouch('stock.unit')}
                    label="Stock Unit"
                  >
                    {stockUnits.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expiry Date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  onBlur={() => handleFieldTouch('expiryDate')}
                  required
                  error={shouldShowError('expiryDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Number"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  onBlur={() => handleFieldTouch('batchNumber')}
                  required
                  error={shouldShowError('batchNumber')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={
                !formData.name ||
                !formData.genericName ||
                !formData.manufacturer ||
                !formData.category ||
                !formData.dosageForm ||
                !formData.pharmacyId ||
                !formData.price ||
                !formData.stock.currentQuantity ||
                !formData.stock.minThreshold ||
                !formData.stock.unit ||
                !formData.batchNumber ||
                !formData.expiryDate
              }
            >
              {selectedMedicine ? 'Update' : 'Add'} Medicine
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MedicineManagement;