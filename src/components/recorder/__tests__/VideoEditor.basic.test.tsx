import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Simple test component
const TestComponent = () => {
  return <div>Test Component</div>;
};

describe('Basic Test', () => {
  it('should render test component', () => {
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should handle basic assertions', () => {
    expect(1 + 1).toBe(2);
  });
}); 