import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signInWithAccountSelect } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async (forceAccountSelect = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceAccountSelect) {
        console.log('🔄 Starting Google sign-in with account selection...');
        await signInWithAccountSelect();
      } else {
        console.log('🔄 Starting quick Google sign-in...');
        await signIn();
      }
      
      console.log('✅ Google sign-in successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          color: '#4646EF', 
          marginBottom: '10px',
          fontSize: 'clamp(24px, 5vw, 32px)'
        }}>
          PursuitShipped
        </h1>
        <p style={{ 
          color: '#666', 
          marginBottom: '30px',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          Sign in with your Pursuit email to continue
        </p>
        
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <button
          onClick={() => handleGoogleSignIn(false)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: loading ? '#ccc' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}
        >
          {loading ? (
            <>🔄 Signing in...</>
          ) : (
            <>🔑 Sign in with Google</>
          )}
        </button>

        <button
          onClick={() => handleGoogleSignIn(true)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          🔄 Use different Pursuit account
        </button>
      </div>
    </div>
  );
};

export default Login; 