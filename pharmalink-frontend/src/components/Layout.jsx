import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  Person,
  LocalPharmacy,
  Home,
  Search,
  Dashboard,
  Store,
  Assessment,
  Settings,
  SmartToy,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Layout = ({ children }) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isAdmin = user?.isAdmin;
  const { cartItems } = useCart();

  // Debug log to verify pathname and authentication status
  console.log('Current pathname:', location.pathname);
  console.log('isAuthenticated:', isAuthenticated);

  const isActivePath = (path) => location.pathname === path;
  
  // Check if we're on the admin login page
  const isAdminLoginPage = location.pathname === '/admin/login';

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/');
  };

  // Admin navigation items
  const adminNavItems = [
    { path: '/admin', icon: <Dashboard />, label: 'Dashboard' },
    { path: '/admin/pharmacies', icon: <Store />, label: 'Pharmacies' },
  ];

  // User navigation items
  const userNavItems = [
    // Include Home and Search for authenticated users or unauthenticated users on non-login/register pages
    ...((isAuthenticated || !['/login', '/register', '/admin/login'].includes(location.pathname)) ? [
      { path: '/', icon: <Home />, label: 'Home' },
      { path: '/search', icon: <Search />, label: 'Search' },
    ] : []),
    ...(isAuthenticated ? [
      { path: '/recommendations', icon: <SmartToy />, label: 'AI Suggest' },
      { 
        path: '/cart', 
        icon: (
          <Badge badgeContent={cartItems.length} color="primary">
            <ShoppingCart />
          </Badge>
        ), 
        label: 'Cart' 
      },
      { path: '/orders', icon: <LocalPharmacy />, label: 'Orders' },
      { path: '/profile', icon: <Person />, label: 'Profile' },
    ] : []),
  ];

  // Debug log to verify userNavItems
  console.log('userNavItems:', userNavItems.map(item => item.label));

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        {isAdmin ? 'Admin Panel' : 'PharmaLink'}
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.path}
            component={RouterLink} 
            to={item.path}
            selected={isActivePath(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {!isAdminLoginPage && (
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              {/* Logo for desktop */}
              <Typography
                variant="h6"
                noWrap
                component={RouterLink}
                to={isAdmin ? '/admin' : '/'}
                sx={{
                  mr: 2,
                  display: { xs: 'none', md: 'flex' },
                  fontWeight: 700,
                  color: 'primary.main',
                  textDecoration: 'none',
                }}
              >
                {isAdmin ? 'Admin Panel' : 'PharmaLink'}
              </Typography>

              {/* Mobile menu icon */}
              <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleDrawerToggle}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              </Box>

              {/* Logo for mobile */}
              <Typography
                variant="h6"
                noWrap
                component={RouterLink}
                to={isAdmin ? '/admin' : '/'}
                sx={{
                  mr: 2,
                  display: { xs: 'flex', md: 'none' },
                  flexGrow: 1,
                  fontWeight: 700,
                  color: 'primary.main',
                  textDecoration: 'none',
                }}
              >
                {isAdmin ? 'Admin Panel' : 'PharmaLink'}
              </Typography>

              {/* Desktop navigation */}
              <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      mx: 1,
                      color: 'text.primary',
                      backgroundColor: isActivePath(item.path) ? 'action.selected' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>

              {/* User menu */}
              <Box sx={{ flexGrow: 0 }}>
                {isAuthenticated ? (
                  <>
                    <Tooltip title="Open settings">
                      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <Avatar>{user?.name?.[0] || 'U'}</Avatar>
                      </IconButton>
                    </Tooltip>
                    <Menu
                      sx={{ mt: '45px' }}
                      id="menu-appbar"
                      anchorEl={anchorElUser}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      <MenuItem onClick={handleLogout}>
                        <Typography textAlign="center">Logout</Typography>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  location.pathname !== '/login' && (
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="contained"
                      color="primary"
                      sx={{
                        backgroundColor: isActivePath('/login') ? 'primary.dark' : 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                    >
                      Login
                    </Button>
                  )
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      )}

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 240,
              backgroundColor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>

      {!isAdmin && (
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg">
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center"
            >
              © {new Date().getFullYear()} PharmaLink. All rights reserved.
            </Typography>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Layout;