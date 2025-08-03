import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Loading from './components/ui/Loading';
import SimpleRecorder from './components/recorder/SimpleRecorder';
import SimpleDashboard from './pages/dashboard/SimpleDashboard';
import SubmissionsPage from './pages/submissions/SubmissionsPage';
import VideoReviewPage from './pages/review/VideoReviewPage';
import theme from './theme';

// Ultra-minimal dashboard component
function MinimalDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleRecordDemo = () => {
    console.log('🎬 Navigate to Record Demo');
    navigate('/record');
  };

  const handleViewSubmissions = () => {
    console.log('👀 Navigate to View Submissions');
    navigate('/submissions');
  };
  
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 20px', 
        backgroundColor: '#4646EF', 
        color: 'white',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: 'clamp(20px, 4vw, 28px)',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/dashboard')}
        >
          PursuitShipped
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ 
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            textAlign: 'right'
          }}>
            {user?.displayName || user?.email}
          </span>
          <button 
            onClick={signOut} 
            style={{ 
              padding: '5px 10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <h2 style={{ 
          fontSize: 'clamp(20px, 4vw, 24px)',
          marginBottom: '10px'
        }}>
          Welcome to Your Dashboard!
        </h2>
        <p style={{ 
          fontSize: 'clamp(14px, 3vw, 16px)',
          marginBottom: '30px'
        }}>
          🎉 Success! The app is working!
        </p>
        
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ 
            fontSize: 'clamp(16px, 3.5vw, 18px)',
            marginBottom: '15px'
          }}>
            Quick Actions:
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={handleRecordDemo}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#4646EF', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                minWidth: '140px'
              }}
            >
              📹 Record Demo
            </button>
            <button 
              onClick={handleViewSubmissions}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                minWidth: '140px'
              }}
            >
              👀 View Submissions
            </button>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            fontSize: 'clamp(14px, 3vw, 16px)',
            marginBottom: '10px'
          }}>
            User Info:
          </h4>
          <p style={{ margin: '5px 0', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
            <strong>Email:</strong> {user?.email}
          </p>
          <p style={{ margin: '5px 0', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
            <strong>Name:</strong> {user?.displayName || 'Not provided'}
          </p>
          <p style={{ margin: '5px 0', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
            <strong>Status:</strong> ✅ Authenticated
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple placeholder pages
function RecordPage() {
  const navigate = useNavigate();
  
  const handleRecordingComplete = (videoBlob: Blob) => {
    console.log('📹 Recording completed, size:', videoBlob.size, 'bytes');
    // In the future, this could upload to Firebase Storage
  };
  
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 20px', 
        backgroundColor: '#4646EF', 
        color: 'white'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: 'clamp(18px, 4vw, 24px)',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/dashboard')}
        >
          PursuitShipped
        </h1>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ 
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Recorder Component */}
      <SimpleRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}

// Placeholder removed - now using real SubmissionsPage component

// Simple route guards
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Test route */}
            <Route path="/test" element={<div style={{padding: '20px'}}>✅ Basic React is working!</div>} />
            
            {/* Login */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <SimpleDashboard />
                </PrivateRoute>
              }
            />

            {/* Record Demo */}
            <Route
              path="/record"
              element={
                <PrivateRoute>
                  <RecordPage />
                </PrivateRoute>
              }
            />

            {/* View Submissions */}
            <Route
              path="/submissions"
              element={
                <PrivateRoute>
                  <SubmissionsPage />
                </PrivateRoute>
              }
            />

            {/* Review Submission */}
            <Route
              path="/review/:submissionId"
              element={
                <PrivateRoute>
                  <VideoReviewPage />
                </PrivateRoute>
              }
            />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
