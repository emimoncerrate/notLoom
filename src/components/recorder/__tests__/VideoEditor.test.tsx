import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoEditor from '../VideoEditor';
import { toast } from 'react-hot-toast';

// Mock the toast function
jest.mock('react-hot-toast', () => ({
  toast: jest.fn()
}));

// Mock the MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  state: 'inactive'
}));

// Mock the MediaSource
global.MediaSource = jest.fn().mockImplementation(() => ({
  addSourceBuffer: jest.fn(),
  endOfStream: jest.fn(),
  readyState: 'open'
}));

describe('VideoEditor', () => {
  const mockVideoBlob = new Blob(['test video content'], { type: 'video/webm' });
  const mockOnSave = jest.fn();
  const mockOnRerecord = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with video blob', () => {
    render(
      <VideoEditor
        videoBlob={mockVideoBlob}
        onSave={mockOnSave}
        onRerecord={mockOnRerecord}
      />
    );

    expect(screen.getByText('Review & Edit Your Recording')).toBeInTheDocument();
  });

  it('should handle video finalization', async () => {
    render(
      <VideoEditor
        videoBlob={mockVideoBlob}
        onSave={mockOnSave}
        onRerecord={mockOnRerecord}
      />
    );

    // Click the save button
    const saveButton = screen.getByText('Save & Continue');
    fireEvent.click(saveButton);

    // Wait for processing to complete
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });

    // Verify the save callback was called with correct parameters
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.any(File),
      expect.any(Array)
    );
  });

  it('should handle finalization errors gracefully', async () => {
    // Mock a failure in createMediaSourceFromSegments
    const mockError = new Error('Test error');
    jest.spyOn(global, 'MediaSource').mockImplementationOnce(() => {
      throw mockError;
    });

    render(
      <VideoEditor
        videoBlob={mockVideoBlob}
        onSave={mockOnSave}
        onRerecord={mockOnRerecord}
      />
    );

    // Click the save button
    const saveButton = screen.getByText('Save & Continue');
    fireEvent.click(saveButton);

    // Wait for error toast to be shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Video processing failed',
          status: 'error'
        })
      );
    });
  });
}); 