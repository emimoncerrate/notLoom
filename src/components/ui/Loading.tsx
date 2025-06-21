import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(45deg, rgba(70,70,239,0.03) 0%, rgba(117,117,255,0.03) 100%)'
      }}
    >
      <img 
        src="/logo.svg" 
        alt="Pursuit Logo" 
        height="80"
        style={{ marginBottom: '20px' }} 
      />
      <CircularProgress 
        size={40} 
        sx={{ 
          color: '#4646EF',
          mb: 2
        }} 
      />
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 500,
          color: '#4646EF'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default Loading; 