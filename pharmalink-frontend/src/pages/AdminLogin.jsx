import { useState } from 'react';
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
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Email,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await adminLogin(formData.email, formData.password);
      navigate('/admin'); // Update to match the route in App.jsx
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in');
    } finally {
      setLoading(false);
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
          background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[100]} 100%)`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <AdminPanelSettings
            sx={{
              fontSize: 48,
              color: theme.palette.primary.main,
              mb: 2,
            }}
          />
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              textAlign: 'center',
            }}
          >
            Admin Login
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, textAlign: 'center' }}
          >
            Secure access for administrators only
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%' }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            label="Admin Email"
            name="email"
            type="email"
            autoComplete="email"
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
            autoComplete="current-password"
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
            }}
          >
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin; 
