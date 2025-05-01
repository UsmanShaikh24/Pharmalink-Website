import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import PharmacyManagement from './pages/admin/PharmacyManagement';
import theme from './theme';
import RecommendationSystem from './components/RecommendationSystem';

// Create a client
const queryClient = new QueryClient();

// Configure future flags for React Router v7
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <Router {...routerOptions}>
              <Layout>
                <Toaster position="top-right" toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                }} />
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/register" element={<Register />} />

                  {/* Admin routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute adminOnly>
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="pharmacies" element={<PharmacyManagement />} />
                          <Route path="reports" element={<div>Reports & Analytics</div>} />
                          <Route path="settings" element={<div>System Settings</div>} />
                        </Routes>
                      </ProtectedRoute>
                    }
                  />

                  {/* User routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute adminRedirect>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute adminRedirect>
                        <Search />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute adminRedirect>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute adminRedirect>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute adminRedirect>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/recommendations" element={
                    <ProtectedRoute>
                      <RecommendationSystem />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Layout>
            </Router>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
