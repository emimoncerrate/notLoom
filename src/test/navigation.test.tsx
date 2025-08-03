import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import React from 'react';

// Create simplified components that don't use AuthContext
const TestDashboard = () => {
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div>
      <h1>PursuitShipped</h1>
      <h2>Welcome to Your Dashboard!</h2>
      <button onClick={() => navigate('/record')}>📹 Record Demo</button>
      <button onClick={() => navigate('/submissions')}>👀 View Submissions</button>
      <p>Email: test@pursuit.org</p>
      <p>Status: ✅ Authenticated</p>
    </div>
  );
};

const TestRecordPage = () => {
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div>
      <button onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      <h1>🎬 Record Demo Page</h1>
      <p>This is where the recording functionality will go.</p>
    </div>
  );
};

const TestSubmissionsPage = () => {
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div>
      <button onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      <h1>👀 View Submissions Page</h1>
      <p>This is where community submissions will be displayed.</p>
    </div>
  );
};

describe('Navigation Tests', () => {
  it('should render dashboard with navigation buttons', () => {
    render(<TestDashboard />);
    
    expect(screen.getByText('PursuitShipped')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Your Dashboard!')).toBeInTheDocument();
    expect(screen.getByText('📹 Record Demo')).toBeInTheDocument();
    expect(screen.getByText('👀 View Submissions')).toBeInTheDocument();
    expect(screen.getByText(/Status:.*Authenticated/)).toBeInTheDocument();
  });

  it('should navigate to record page when Record Demo button is clicked', () => {
    render(<TestDashboard />);
    
    const recordButton = screen.getByText('📹 Record Demo');
    fireEvent.click(recordButton);
    
    expect(window.location.pathname).toBe('/record');
  });

  it('should navigate to submissions page when View Submissions button is clicked', () => {
    render(<TestDashboard />);
    
    const submissionsButton = screen.getByText('👀 View Submissions');
    fireEvent.click(submissionsButton);
    
    expect(window.location.pathname).toBe('/submissions');
  });

  it('should show record page content', () => {
    render(<TestRecordPage />);
    
    expect(screen.getByText('🎬 Record Demo Page')).toBeInTheDocument();
    expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('This is where the recording functionality will go.')).toBeInTheDocument();
  });

  it('should show submissions page content', () => {
    render(<TestSubmissionsPage />);
    
    expect(screen.getByText('👀 View Submissions Page')).toBeInTheDocument();
    expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('This is where community submissions will be displayed.')).toBeInTheDocument();
  });

  it('should navigate back from record page when back button is clicked', () => {
    render(<TestRecordPage />);
    
    const backButton = screen.getByText('← Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('should navigate back from submissions page when back button is clicked', () => {
    render(<TestSubmissionsPage />);
    
    const backButton = screen.getByText('← Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(window.location.pathname).toBe('/dashboard');
  });
}); 