import { Box, Container, Typography, Grid, Paper, useTheme, Divider, Chip } from '@mui/material';
import {
  LocalPharmacy,
  LocalShipping,
  Support,
  Security,
  VerifiedUser,
  LocalHospital,
  Timer,
  Medication,
  LocationOn,
  Search,
  Assignment,
  Payment
} from '@mui/icons-material';

const Home = () => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      background: (theme) => `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.primary.light}15)`,
    }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: '100%',
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          mb: { xs: 4, md: 6 },
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
        <Container maxWidth="lg">
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
              textAlign: { xs: 'center', md: 'left' },
              gap: 2,
            }}
          >
            <Typography 
              variant="h1" 
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 2,
                background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.8))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PharmaLink
            </Typography>
            <Typography 
              variant="h5" 
              sx={{
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                fontWeight: 400,
                mb: 3,
                maxWidth: '800px',
                opacity: 0.9,
              }}
            >
              Your comprehensive digital pharmacy platform connecting patients with local pharmacies for seamless medication access and management.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Key Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <Search sx={{ fontSize: 32 }} />,
              title: 'Smart Medicine Search',
              description: 'Advanced search functionality to find medications by name, category, or medical condition.',
              color: theme.palette.primary.main
            },
            {
              icon: <LocationOn sx={{ fontSize: 32 }} />,
              title: 'Nearby Pharmacy Locator',
              description: 'Find medications at pharmacies near you with real-time availability information.',
              color: theme.palette.success.main
            },
            {
              icon: <Assignment sx={{ fontSize: 32 }} />,
              title: 'Prescription Management',
              description: 'Securely upload and manage your prescriptions for hassle-free ordering.',
              color: theme.palette.info.main
            },
            {
              icon: <Payment sx={{ fontSize: 32 }} />,
              title: 'Secure Transactions',
              description: 'Safe and encrypted payment processing for all your medication purchases.',
              color: theme.palette.warning.main
            }
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
                    borderColor: feature.color,
                  },
                }}
              >
                <Box
                  sx={{
                    color: feature.color,
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: '1.125rem',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography 
          variant="h4" 
          sx={{
            fontWeight: 700,
            mb: 4,
            textAlign: 'center',
          }}
        >
          How PharmaLink Works
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              step: '01',
              title: 'Search Medications',
              description: 'Use our intelligent search system to find your prescribed medications or over-the-counter drugs.',
              icon: <Medication />,
            },
            {
              step: '02',
              title: 'Compare & Select',
              description: 'Compare prices and availability across multiple pharmacies in your area.',
              icon: <LocalHospital />,
            },
            {
              step: '03',
              title: 'Verify & Order',
              description: 'Upload your prescription if required and place your order securely.',
              icon: <VerifiedUser />,
            },
            {
              step: '04',
              title: 'Quick Delivery',
              description: 'Get your medications delivered to your doorstep or pick up from your chosen pharmacy.',
              icon: <LocalShipping />,
            },
          ].map((item, index) => (
            <Grid item xs={12} md={3} key={index}>
              <Box
                sx={{
                  position: 'relative',
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Chip
                  label={item.step}
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontWeight: 600,
                  }}
                />
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Safety & Security Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Your Safety is Our Priority
          </Typography>
          <Grid container spacing={3}>
            {[
              {
                icon: <Security sx={{ fontSize: 24 }} />,
                title: 'Verified Pharmacies',
                description: 'All partner pharmacies are licensed and regularly audited.'
              },
              {
                icon: <Timer sx={{ fontSize: 24 }} />,
                title: 'Real-time Tracking',
                description: 'Monitor your order status from purchase to delivery.'
              },
              {
                icon: <Support sx={{ fontSize: 24 }} />,
                title: '24/7 Support',
                description: 'Professional healthcare support whenever you need it.'
              }
            ].map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home; 