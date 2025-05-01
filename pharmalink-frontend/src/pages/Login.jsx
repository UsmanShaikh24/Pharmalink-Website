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
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
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
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: 'primary.main',
            textAlign: 'center',
          }}
        >
          Welcome Back
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          Sign in to continue to PharmaLink
        </Typography>

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
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <Box sx={{ width: '100%', textAlign: 'center', mb: 2 }}>
            <Link component={RouterLink} to="/register" variant="body2">
              Don't have an account? Sign Up
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => navigate('/admin/login')}
            startIcon={<AdminPanelSettings />}
            sx={{
              py: 1.5,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Admin Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 