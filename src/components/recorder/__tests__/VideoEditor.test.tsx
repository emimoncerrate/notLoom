import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import VideoEditor from '../VideoEditor';
import { toast } from 'react-hot-toast';

// Mock the toast function
vi.mock('react-hot-toast', () => ({
  toast: vi.fn()
}));

// Mock the MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: vi.fn(),
  onstop: vi.fn(),
  state: 'inactive'
}));

// Mock the MediaSource
global.MediaSource = vi.fn().mockImplementation(() => ({
  addSourceBuffer: vi.fn(),
  endOfStream: vi.fn(),
  readyState: 'open'
}));

describe('VideoEditor', () => {
  const mockVideoBlob = new Blob(['test video content'], { type: 'video/webm' });
  const mockOnSave = vi.fn();
  const mockOnRerecord = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.spyOn(global, 'MediaSource').mockImplementationOnce(() => {
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
          title: 'No video to save',
          status: 'error'
        })
      );
    });
  });
}); 