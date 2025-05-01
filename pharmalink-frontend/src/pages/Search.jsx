import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Alert,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Skeleton,
  IconButton,
  Slider,
  Switch,
  FormControlLabel,
  Badge,
  CircularProgress,
  Collapse,
  Autocomplete,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  AddShoppingCart,
  LocalPharmacy,
  LocalShipping,
  Timer,
  Star,
  CompareArrows,
  FilterAlt,
  LocationOn,
  Sort as SortIcon,
  Clear as ClearIcon,
  Favorite,
  FavoriteBorder,
  LocalOffer,
  Info,
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useCart } from '../contexts/CartContext';

const Search = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Initialize state from sessionStorage if available
  const [medicines, setMedicines] = useState(() => {
    const saved = sessionStorage.getItem('searchMedicines');
    return saved ? JSON.parse(saved) : [];
  });
  const [totalItems, setTotalItems] = useState(() => {
    const saved = sessionStorage.getItem('searchTotalItems');
    return saved ? parseInt(saved) : 0;
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem('searchTerm') || '';
  });
  const [category, setCategory] = useState(() => {
    return sessionStorage.getItem('searchCategory') || 'All';
  });
  const [sortBy, setSortBy] = useState(() => {
    return sessionStorage.getItem('searchSortBy') || 'name';
  });
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem('searchPage');
    return saved ? parseInt(saved) : 1;
  });
  const [selectedMed, setSelectedMed] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrescriptionOnly, setShowPrescriptionOnly] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(() => {
    return sessionStorage.getItem('searchShowFilters') === 'true';
  });
  const itemsPerPage = 9;
  const [suggestions, setSuggestions] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [location, setLocation] = useState(() => {
    const saved = sessionStorage.getItem('searchLocation');
    return saved ? JSON.parse(saved) : null;
  });
  const [radius, setRadius] = useState(() => {
    const saved = sessionStorage.getItem('searchRadius');
    return saved ? parseInt(saved) : 5;
  });
  const [locationError, setLocationError] = useState('');
  const [useLocation, setUseLocation] = useState(() => {
    return sessionStorage.getItem('searchUseLocation') === 'true';
  });
  const [requiresPrescription, setRequiresPrescription] = useState(() => {
    return sessionStorage.getItem('searchRequiresPrescription') === 'true';
  });
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const { addToCart } = useCart();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(() => {
    // Try to get the saved pharmacy ID
    const saved = sessionStorage.getItem('searchSelectedPharmacy');
    
    // Return empty string immediately if no saved value (this will render as "All Pharmacies")
    if (!saved || saved === "undefined" || saved === "null" || saved === "") {
      return '';
    }
    
    // Return the saved value but validate it later when pharmacies are loaded
    return saved;
  });
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('searchMedicines', JSON.stringify(medicines));
    sessionStorage.setItem('searchTotalItems', totalItems.toString());
    sessionStorage.setItem('searchTerm', searchTerm);
    sessionStorage.setItem('searchCategory', category);
    sessionStorage.setItem('searchSortBy', sortBy);
    sessionStorage.setItem('searchPage', page.toString());
    sessionStorage.setItem('searchRequiresPrescription', requiresPrescription.toString());
    sessionStorage.setItem('searchShowFilters', showFilters.toString());
    sessionStorage.setItem('searchRadius', radius.toString());
    sessionStorage.setItem('searchUseLocation', useLocation.toString());
    sessionStorage.setItem('searchSelectedPharmacy', selectedPharmacy);
    if (location) {
      sessionStorage.setItem('searchLocation', JSON.stringify(location));
    }
  }, [medicines, totalItems, searchTerm, category, sortBy, page, requiresPrescription, showFilters, radius, useLocation, location, selectedPharmacy]);

  // Clear search state when component unmounts
  useEffect(() => {
    return () => {
      // Don't clear the state on unmount to persist it between page navigations
      // Only clear if user explicitly resets the search
    };
  }, []);

  useEffect(() => {
    if (searchTerm || category !== 'All' || sortBy !== 'name' || requiresPrescription || selectedPharmacy) {
      loadMedicines();
      setHasSearched(true);
    } else {
      setMedicines([]);
      setTotalItems(0);
      setHasSearched(false);
    }
  }, [page, searchTerm, category, sortBy, requiresPrescription, useLocation, radius, selectedPharmacy]);

  // Add axios interceptor for authentication
  useEffect(() => {
    // Add request interceptor
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        // Add token to headers if it exists
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle 401 errors
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login if unauthorized
          localStorage.removeItem('token');
          setAuthToken(null);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on component unmount
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Save scroll position when unmounting
  useEffect(() => {
    // Save scroll position before unmounting
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Restore scroll position when component mounts
    if (scrollPosition !== 0) {
      window.scrollTo(0, scrollPosition);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Save scroll position to sessionStorage when unmounting
      sessionStorage.setItem('searchScrollPosition', scrollPosition.toString());
    };
  }, [scrollPosition]);

  // Restore scroll position when component mounts
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('searchScrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
      setScrollPosition(parseInt(savedPosition));
    }
  }, []);

  const updateLocation = () => {
    if (!useLocation) {
      setLocationError('');
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setUseLocation(true);
          loadMedicines();
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Could not get your location. Please try again.');
          setLocation(null);
          setUseLocation(false);
        }
      );
    } else {
      setLocation(null);
      setUseLocation(false);
      loadMedicines();
    }
  };

  const handleRadiusChange = (event) => {
    const newRadius = event.target.value;
    setRadius(newRadius);
    if (location) {
      loadMedicines();
    }
  };

  // Add a function to lookup pharmacy by ID to get details
  const getPharmacyDetails = async (pharmacyId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axiosInstance.get(`/api/pharmacies/${pharmacyId}`);
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get details for pharmacy ID: ${pharmacyId}`, error);
      return null;
    }
  };

  // Update loadMedicines to try multiple approaches for pharmacy filtering
  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to search medicines');
        window.location.href = '/login';
        return;
      }

      // Create params object
      const requestParams = {
        page,
        limit: 9,
        search: searchTerm,
        category: category !== 'All' ? category : '',
        sortBy
      };

      // Add location parameters if applicable
      if (useLocation && location) {
        requestParams.latitude = location.latitude;
        requestParams.longitude = location.longitude;
        requestParams.radius = radius.toString();
      }

      // Add prescription requirement if applicable
      if (requiresPrescription) {
        requestParams.requiresPrescription = 'true';
      }

      // Handle pharmacy filtering with multiple fallback approaches
      if (selectedPharmacy && selectedPharmacy.trim() !== '') {
        // Approach 1: Try to get pharmacy details to ensure it exists
        console.log("Looking up pharmacy details for ID:", selectedPharmacy);
        const pharmacyDetails = await getPharmacyDetails(selectedPharmacy);
        
        if (pharmacyDetails) {
          // Use pharmacy name if we have the details
          console.log(`Using pharmacy name "${pharmacyDetails.name}" from fetched details`);
          requestParams.pharmacyName = pharmacyDetails.name;
        } else {
          // Approach 2: Use pharmacy from our loaded list
          const selectedPharmacyObj = pharmacies.find(p => p._id === selectedPharmacy);
          
          if (selectedPharmacyObj && selectedPharmacyObj.name) {
            console.log(`Using pharmacy name "${selectedPharmacyObj.name}" from loaded pharmacies`);
            requestParams.pharmacyName = selectedPharmacyObj.name;
          } else {
            console.log(`Could not find pharmacy with ID ${selectedPharmacy}, removing filter`);
          }
        }
      }

      console.log('Final search params:', requestParams);

      // Convert to URLSearchParams and make the request
      const params = new URLSearchParams(requestParams);
      const response = await axiosInstance.get('/api/medicines', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('API Response:', response.data);
      setMedicines(response.data.medicines);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      console.error('Error loading medicines:', error);
      if (error.response?.status === 401) {
        setError('Please log in to search medicines');
      } else if (error.response?.status === 400) {
        // Handle bad request errors more gracefully
        console.error('Bad request error details:', error.response?.data);
        setError('Could not apply filters. Please try again or select a different pharmacy.');
        
        // Reset pharmacy selection if that's the issue
        if (selectedPharmacy) {
          setSelectedPharmacy('');
          sessionStorage.removeItem('searchSelectedPharmacy');
        }
      } else {
        setError('Failed to load medicines. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axiosInstance.get('/api/medicines/suggestions', {
        params: { search: input }
      });
      if (response.data && Array.isArray(response.data.suggestions)) {
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const debouncedLoadSuggestions = debounce(loadSuggestions, 300);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    // Clear both state and sessionStorage
    setSearchTerm('');
    setCategory('All');
    setSortBy('name');
    setShowPrescriptionOnly(false);
    setSelectedPharmacy('');
    setPage(1);
    setShowFilters(false);
    setUseLocation(false);
    setLocation(null);
    setRadius(5);
    
    // Clear sessionStorage
    sessionStorage.removeItem('searchMedicines');
    sessionStorage.removeItem('searchTotalItems');
    sessionStorage.removeItem('searchTerm');
    sessionStorage.removeItem('searchCategory');
    sessionStorage.removeItem('searchSortBy');
    sessionStorage.removeItem('searchPage');
    sessionStorage.removeItem('searchRequiresPrescription');
    sessionStorage.removeItem('searchShowFilters');
    sessionStorage.removeItem('searchRadius');
    sessionStorage.removeItem('searchUseLocation');
    sessionStorage.removeItem('searchLocation');
    sessionStorage.removeItem('searchScrollPosition');
    sessionStorage.removeItem('searchSelectedPharmacy');
    
    // Force reload of pharmacies to ensure select has valid options
    loadPharmacies();
  };

  const handleMedicationClick = (medication) => {
    setSelectedMed(medication);
  };

  const handleCloseDialog = () => {
    setSelectedMed(null);
    setShowAlternatives(false);
  };

  const toggleFavorite = (medicationId) => {
    setFavorites(prev => 
      prev.includes(medicationId)
        ? prev.filter(id => id !== medicationId)
        : [...prev, medicationId]
    );
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  const handlePrescriptionFilterChange = (event) => {
    setRequiresPrescription(event.target.checked);
    setPage(1);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAddToCart = (e, medicine) => {
    e.stopPropagation(); // Prevent card click event
    addToCart(medicine);
    setSnackbar({
      open: true,
      message: `${medicine.name} added to cart`,
      severity: 'success'
    });
  };

  const handleAddToCartFromDialog = (e) => {
    e.preventDefault();
    if (selectedMed) {
      addToCart(selectedMed);
      setSnackbar({
        open: true,
        message: `${selectedMed.name} added to cart`,
        severity: 'success'
      });
    }
  };

  const handlePharmacyChange = (event) => {
    const newPharmacyId = event.target.value;
    console.log("Selected pharmacy ID:", newPharmacyId);
    
    // Find the pharmacy to get its name for logging
    if (newPharmacyId) {
      const pharmacy = pharmacies.find(p => p._id === newPharmacyId);
      if (pharmacy) {
        console.log(`Selected "${pharmacy.name}" with ID ${newPharmacyId}`);
      } else {
        console.warn(`Selected pharmacy ID ${newPharmacyId} not found in loaded pharmacies!`);
      }
    } else {
      console.log("Cleared pharmacy selection");
    }
    
    setSelectedPharmacy(newPharmacyId);
    setPage(1);
  };

  const loadPharmacies = async () => {
    try {
      setPharmaciesLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to search medicines');
        return;
      }

      console.log("Fetching pharmacies...");
      const response = await axiosInstance.get('/api/pharmacies');

      if (response.data && Array.isArray(response.data)) {
        console.log(`Successfully loaded ${response.data.length} pharmacies:`, 
          response.data.map(p => ({ id: p._id, name: p.name }))
        );
        setPharmacies(response.data);
      } else {
        console.error("Invalid pharmacy response format:", response.data);
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    } finally {
      setPharmaciesLoading(false);
    }
  };

  // Load pharmacies when component mounts
  useEffect(() => {
    loadPharmacies();
  }, []);

  // Debug output for available pharmacy values
  useEffect(() => {
    if (pharmacies.length > 0) {
      console.log("Available pharmacy options:", pharmacies.map(p => ({ id: p._id, name: p.name })));
    }
  }, [pharmacies]);

  // Add an effect to validate selectedPharmacy when pharmacies are loaded
  useEffect(() => {
    // Skip if we have no selected pharmacy or no pharmacies loaded yet
    if (!selectedPharmacy || pharmacies.length === 0) return;
    
    // Check if the selected pharmacy exists in our options
    const pharmacyExists = pharmacies.some(p => p._id === selectedPharmacy);
    
    if (!pharmacyExists) {
      console.warn(`Selected pharmacy ID ${selectedPharmacy} not found in available options. Resetting selection.`);
      setSelectedPharmacy('');
      sessionStorage.removeItem('searchSelectedPharmacy');
    }
  }, [pharmacies]);

  const renderMedicationCard = (medicine) => (
    <Zoom in={!loading} style={{ transitionDelay: loading ? '500ms' : '0ms' }}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: (theme) => `0 12px 24px ${theme.palette.primary.main}25`,
          },
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={() => handleMedicationClick(medicine)}
      >
        <Box
          sx={{
            position: 'relative',
            p: 3,
            bgcolor: (theme) => 
              medicine.requiresPrescription 
                ? theme.palette.warning.light + '15'
                : theme.palette.success.light + '15',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 1,
            }}
          >
            <Chip
              label={medicine.requiresPrescription ? 'Prescription' : 'OTC'}
              color={medicine.requiresPrescription ? 'warning' : 'success'}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: '24px',
                backgroundColor: medicine.requiresPrescription 
                  ? 'rgba(255, 152, 0, 0.9)'
                  : 'rgba(76, 175, 80, 0.9)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          </Box>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: 'text.primary',
              fontSize: '1.25rem',
              pr: 7, // Make room for the chip
            }}
          >
            {medicine.name || 'Unnamed Medicine'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ 
              mb: 2,
              fontSize: '0.875rem',
              fontStyle: 'italic'
            }}
          >
            {medicine.genericName || 'Generic name not available'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
            <LocalPharmacy sx={{ fontSize: '1rem', color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {medicine.pharmacy?.name || 'Pharmacy not specified'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
            ₹{(medicine.price || 0).toFixed(2)}
          </Typography>
          {typeof medicine.distance === 'number' && (
            <Chip
              icon={<LocationOn sx={{ fontSize: '1rem' }} />}
              label={`${medicine.distance.toFixed(1)} km`}
              size="small"
              variant="outlined"
              sx={{ 
                borderColor: 'primary.main',
                color: 'primary.main',
                '& .MuiChip-icon': { color: 'primary.main' }
              }}
            />
          )}
        </Box>
      </Card>
    </Zoom>
  );

  const renderSkeleton = () => (
    <Card sx={{ height: '100%', borderRadius: theme.shape.borderRadius * 2 }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="90%" height={40} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" height={24} />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="rectangular" width="30%" height={36} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: (theme) => `linear-gradient(to bottom, ${theme.palette.primary.light}15, ${theme.palette.background.default})`,
        pt: { xs: 2, sm: 3 },
        pb: { xs: 4, sm: 6 },
      }}
    >
      <Container maxWidth="xl">
        {/* Hero Section */}
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            mb: { xs: 3, sm: 4 },
            borderRadius: { xs: 2, sm: 3 },
            overflow: 'hidden',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <Box 
            sx={{ 
              position: 'relative',
              zIndex: 1,
              p: { xs: 3, sm: 4, md: 5 },
            }}
          >
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                color: 'common.white',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                mb: { xs: 1, sm: 2 },
              }}
            >
              Find Your Medications
            </Typography>
            <Typography 
              variant="h6"
              sx={{
                color: 'common.white',
                maxWidth: 600,
                mb: { xs: 3, sm: 4 },
                opacity: 0.9,
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                lineHeight: 1.5,
              }}
            >
              Search through our extensive catalog of medicines and find the best prices from trusted pharmacies near you.
            </Typography>

            {/* Search Controls */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: { xs: 2, sm: 3 },
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={suggestions}
                    value={searchTerm}
                    inputValue={searchInput}
                    onInputChange={(event, newInputValue) => {
                      setSearchInput(newInputValue);
                      debouncedLoadSuggestions(newInputValue);
                    }}
                    onChange={(event, newValue) => {
                      setSearchTerm(newValue || '');
                      setPage(1);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        variant="outlined"
                        placeholder="Search medications..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="primary" />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            '&.MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'divider',
                              },
                              '&:hover fieldset': {
                                borderColor: 'primary.main',
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={category}
                      label="Category"
                      onChange={handleCategoryChange}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'background.paper',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      {['All', 'Pain Relief', 'Antibiotics', 'Allergies', 'First Aid', 'Vitamins'].map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={handleSortChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <SortIcon />
                        </InputAdornment>
                      }
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'background.paper',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <MenuItem value="name">Name: A to Z</MenuItem>
                      <MenuItem value="price_low">Price: Low to High</MenuItem>
                      <MenuItem value="price_high">Price: High to Low</MenuItem>
                      {location && <MenuItem value="distance">Distance: Nearest First</MenuItem>}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Pharmacy</InputLabel>
                    <Select
                      value={
                        // Only use selectedPharmacy if it exists in the options
                        pharmacies.some(p => p._id === selectedPharmacy) 
                          ? selectedPharmacy 
                          : ''
                      }
                      label="Pharmacy"
                      onChange={handlePharmacyChange}
                      disabled={pharmaciesLoading}
                      displayEmpty
                      startAdornment={
                        pharmaciesLoading ? (
                          <InputAdornment position="start">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ) : (
                          <InputAdornment position="start">
                            <LocalPharmacy />
                          </InputAdornment>
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'background.paper',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                      renderValue={(selected) => {
                        if (!selected) {
                          return "All Pharmacies";
                        }
                        
                        const pharmacy = pharmacies.find(p => p._id === selected);
                        return pharmacy ? pharmacy.name : "All Pharmacies";
                      }}
                    >
                      <MenuItem value="">All Pharmacies</MenuItem>
                      {pharmaciesLoading ? (
                        <MenuItem disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading pharmacies...
                          </Box>
                        </MenuItem>
                      ) : pharmacies.length === 0 ? (
                        <MenuItem disabled>No pharmacies available</MenuItem>
                      ) : (
                        pharmacies.map((pharmacy) => (
                          <MenuItem key={pharmacy._id} value={pharmacy._id}>
                            {pharmacy.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Collapse in={showFilters}>
                <Box 
                  sx={{ 
                    mt: 3, 
                    pt: 3, 
                    borderTop: 1, 
                    borderColor: 'divider',
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={requiresPrescription}
                              onChange={handlePrescriptionFilterChange}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Show Prescription Medications Only
                            </Typography>
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          gutterBottom
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <LocationOn fontSize="small" />
                          Find Nearest Pharmacy
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Button
                            variant={useLocation ? "contained" : "outlined"}
                            onClick={updateLocation}
                            startIcon={<LocationOn />}
                            size="small"
                            color={useLocation ? "primary" : "inherit"}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              boxShadow: useLocation ? 2 : 0,
                            }}
                          >
                            {useLocation ? 'Location Active' : 'Use My Location'}
                          </Button>
                          {useLocation && location && (
                            <FormControl sx={{ minWidth: 120 }}>
                              <Select
                                value={radius}
                                onChange={handleRadiusChange}
                                size="small"
                                displayEmpty
                                renderValue={(value) => `${value} km radius`}
                                sx={{ borderRadius: 2 }}
                              >
                                <MenuItem value={5}>5 km radius</MenuItem>
                                <MenuItem value={10}>10 km radius</MenuItem>
                                <MenuItem value={20}>20 km radius</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </Box>
                        {locationError && (
                          <Typography 
                            color="error" 
                            variant="caption" 
                            sx={{ mt: 1, display: 'block' }}
                          >
                            {locationError}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>

              <Box 
                sx={{ 
                  mt: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Button
                  startIcon={<FilterAlt />}
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  sx={{
                    color: showFilters ? 'primary.main' : 'text.secondary',
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                {(searchTerm || category !== 'All' || sortBy !== 'name' || requiresPrescription || selectedPharmacy) && (
                  <Button
                    startIcon={<ClearIcon />}
                    onClick={handleClearSearch}
                    size="small"
                    color="error"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'error.lighter',
                      },
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        </Paper>

        {/* Results Section */}
        {hasSearched && (
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Grid 
              container 
              spacing={2} 
              alignItems="center" 
              sx={{ mb: { xs: 2, sm: 3 } }}
            >
              <Grid item>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  Search Results
                  <Badge 
                    badgeContent={totalItems} 
                    color="primary"
                    showZero
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '20px',
                        minWidth: '20px',
                      },
                    }}
                  >
                    <Chip
                      icon={<FilterAlt />}
                      label="Medications found"
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: '16px',
                        ml: 1,
                      }}
                    />
                  </Badge>
                </Typography>
              </Grid>
            </Grid>

            {error ? (
              <Paper
                sx={{
                  p: { xs: 3, sm: 4 },
                  textAlign: 'center',
                  borderRadius: { xs: 2, sm: 3 },
                  backgroundColor: 'background.paper',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Typography 
                  variant="h6" 
                  color="error" 
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  {error}
                </Typography>
              </Paper>
            ) : (
              <>
                <Grid container spacing={3}>
                  {loading ? (
                    Array.from(new Array(6)).map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        {renderSkeleton()}
                      </Grid>
                    ))
                  ) : (
                    medicines.map((medicine) => (
                      <Grid item xs={12} sm={6} md={4} key={medicine._id}>
                        {renderMedicationCard(medicine)}
                      </Grid>
                    ))
                  )}
                </Grid>

                {/* Empty State */}
                {!loading && medicines.length === 0 && (
                  <Paper
                    sx={{
                      p: { xs: 3, sm: 4 },
                      textAlign: 'center',
                      borderRadius: { xs: 2, sm: 3 },
                      backgroundColor: 'background.paper',
                      mt: { xs: 3, sm: 4 },
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontWeight: 500 }}
                    >
                      No medications found
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      Try adjusting your search criteria or browse all categories
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleClearSearch}
                      startIcon={<ClearIcon />}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        px: 3,
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </Paper>
                )}

                {/* Pagination */}
                {medicines.length > 0 && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      mt: { xs: 3, sm: 4 },
                    }}
                  >
                    <Pagination
                      count={Math.ceil(totalItems / itemsPerPage)}
                      page={page}
                      onChange={(e, value) => setPage(value)}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Medicine Details Dialog */}
        <Dialog
          open={Boolean(selectedMed)}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
            },
          }}
        >
          {selectedMed && (
            <>
              <DialogTitle
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 2 },
                  background: theme.palette.background.default,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography 
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                  >
                    {selectedMed.name}
                  </Typography>
                  <Chip
                    label={selectedMed.requiresPrescription ? 'Prescription Required' : 'Over the Counter'}
                    color={selectedMed.requiresPrescription ? 'warning' : 'success'}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      fontWeight: 500,
                      '& .MuiChip-label': {
                        px: 2,
                      },
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent 
                dividers
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: { xs: 2, sm: 3 },
                  background: theme.palette.background.default,
                }}
              >
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3, p: 3, bgcolor: (theme) => theme.palette.primary.light + '15', borderRadius: 2 }}>
                      <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        {selectedMed.name}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {selectedMed.genericName}
                      </Typography>
                      <Chip
                        label={selectedMed.requiresPrescription ? 'Prescription Required' : 'Over the Counter'}
                        color={selectedMed.requiresPrescription ? 'warning' : 'success'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>Details</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Generic Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedMed.genericName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Manufacturer
                        </Typography>
                        <Typography variant="body1">
                          {selectedMed.manufacturer}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Category
                        </Typography>
                        <Typography variant="body1">
                          {selectedMed.category}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedMed.description}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                          ₹{selectedMed.price.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Available at Pharmacy
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pharmacy Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedMed.pharmacy?.name || 'Unknown Pharmacy'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {selectedMed.pharmacy?.address?.street}, {selectedMed.pharmacy?.address?.city}
                      </Typography>
                    </Box>
                    {selectedMed.pharmacy?.contactNumber && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Contact Number
                        </Typography>
                        <Typography variant="body1">
                          {selectedMed.pharmacy.contactNumber}
                        </Typography>
                      </Box>
                    )}
                    {selectedMed.pharmacy?.operatingHours && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Operating Hours
                        </Typography>
                        <Typography variant="body1">
                          {selectedMed.pharmacy.operatingHours.open} - {selectedMed.pharmacy.operatingHours.close}
                        </Typography>
                      </Box>
                    )}
                    {selectedMed.distance !== undefined && selectedMed.distance !== null && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Distance
                        </Typography>
                        <Chip
                          icon={<LocationOn />}
                          label={`${selectedMed.distance.toFixed(1)} km away`}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    )}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Stock Information
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {selectedMed.stock.currentQuantity} {selectedMed.stock.unit} available
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={<AddShoppingCart />}
                        onClick={handleAddToCartFromDialog}
                        disabled={selectedMed.stock.currentQuantity === 0}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          py: 1.5,
                          mb: 2,
                        }}
                      >
                        {selectedMed.stock.currentQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 2 },
                  background: theme.palette.background.default,
                }}
              >
                <Button 
                  onClick={handleCloseDialog}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
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
    </Box>
  );
};

export default Search; 
