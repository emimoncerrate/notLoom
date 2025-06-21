import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/home/HomePage';
import BuilderPage from './pages/builder/BuilderPage';
import StaffPage from './pages/staff/StaffPage';
import ConfirmationPage from './pages/builder/ConfirmationPage';
import Login from './pages/auth/Login';
import Loading from './components/ui/Loading';
import theme from './theme';
import ErrorBoundary from './components/ErrorBoundary';

// Role-based route component
const RoleRoute: React.FC<{ 
  children: React.ReactNode, 
  allowedRoles: string[] 
}> = ({ children, allowedRoles }) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Handles routes that should only be accessible when NOT logged in (like login page)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  // If user is logged in with a valid email, redirect to home page
  if (user && user.email?.endsWith('@pursuit.org')) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Dashboard redirect based on user role
const DashboardRedirect: React.FC = () => {
  const { role, loading, user } = useAuth();

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  let targetPath = '/builder/dashboard';
  switch (role) {
    case 'staff':
      targetPath = '/staff/dashboard';
      break;
    case 'alumni':
      targetPath = '/alumni/dashboard';
      break;
    case 'builder':
      targetPath = '/builder/dashboard';
      break;
    default:
      console.warn(`DashboardRedirect: Unknown or null role ('${role}'), defaulting to ${targetPath}`);
      break;
  }
  
  return <Navigate to={targetPath} />;
};

// App component wrapped with AuthProvider
const AppContent = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return <Loading message="Loading PursuitShipped..." />;
  }

  return (
    <Router>
      <Routes>
          {/* --- TEMPORARY TEST ROUTE --- */}
          {/* <Route path="/" element={<div>Hello world - Basic Render Test</div>} /> */}
          
          {/* 
          // --- ORIGINAL ROUTES (Commented out for testing) --- 
          */}
          {/* Re-enable original routes */} 
          {/* Login route */} 
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
  
          {/* Role-based dashboard redirects */} 
          <Route path="/" element={<DashboardRedirect />} />
  
          {/* Builder routes */} 
          <Route
            path="/builder/dashboard"
            element={
              <RoleRoute allowedRoles={['builder', 'staff']}>
                <HomePage roleSpecificView="builder" />
              </RoleRoute>
            }
          />
          <Route
            path="/builder/record"
            element={
              <RoleRoute allowedRoles={['builder', 'staff']}>
                <BuilderPage />
              </RoleRoute>
            }
          />
          <Route
            path="/builder/confirmation"
            element={
              <RoleRoute allowedRoles={['builder', 'staff']}>
                <ConfirmationPage />
              </RoleRoute>
            }
          />
  
          {/* Staff routes */} 
          <Route
            path="/staff/dashboard"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <HomePage roleSpecificView="staff" />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/submissions"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <StaffPage />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/feedback/:submissionId"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <StaffPage />
              </RoleRoute>
            }
          />
  
          {/* Alumni routes */} 
          <Route
            path="/alumni/dashboard"
            element={
              <RoleRoute allowedRoles={['alumni', 'staff']}>
                <HomePage roleSpecificView="alumni" />
              </RoleRoute>
            }
          />
          
          {/* Legacy routes - redirect to the new routes */} 
          <Route path="/builder" element={<Navigate to="/builder/dashboard" />} />
          <Route path="/staff" element={<Navigate to="/staff/dashboard" />} />
          <Route path="/submissions" element={<Navigate to="/staff/submissions" />} />
          <Route path="/confirmation" element={<Navigate to="/builder/confirmation" />} />
          
          {/* Redirect all other routes */} 
          <Route path="*" element={<DashboardRedirect />} />
          {/* --- END ORIGINAL ROUTES --- */}
          {/* 
          */}
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
