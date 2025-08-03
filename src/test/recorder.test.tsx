import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimpleRecorder from '../components/recorder/SimpleRecorder';

// Mock MediaRecorder and navigator.mediaDevices
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as any,
  onstop: null as any,
  state: 'inactive'
};

const mockStream = {
  getTracks: vi.fn(() => [
    { stop: vi.fn() },
    { stop: vi.fn() }
  ]),
  getVideoTracks: vi.fn(() => [{ kind: 'video' }]),
  getAudioTracks: vi.fn(() => [{ kind: 'audio' }])
};

// Mock global MediaRecorder
global.MediaRecorder = vi.fn(() => mockMediaRecorder) as any;
(global.MediaRecorder as any).isTypeSupported = vi.fn(() => true);

// Mock navigator.mediaDevices
const mockGetDisplayMedia = vi.fn();
const mockGetUserMedia = vi.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getDisplayMedia: mockGetDisplayMedia,
    getUserMedia: mockGetUserMedia
  },
  configurable: true
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-video-url');
global.URL.revokeObjectURL = vi.fn();

describe('SimpleRecorder Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDisplayMedia.mockResolvedValue(mockStream);
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  it('should render recording interface with all controls', () => {
    render(<SimpleRecorder />);
    
    expect(screen.getByText('🎬 Record Your Demo')).toBeInTheDocument();
    expect(screen.getByText('Recording Mode:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('🖥️ + 🎤 Screen + Microphone')).toBeInTheDocument();
    expect(screen.getByText('🔴 Start Recording')).toBeInTheDocument();
    expect(screen.getByText('📋 How to Record:')).toBeInTheDocument();
  });

  it('should have three recording mode options', () => {
    render(<SimpleRecorder />);
    
    const select = screen.getByDisplayValue('🖥️ + 🎤 Screen + Microphone');
    
    // Check all options are present
    expect(screen.getByText('🖥️ + 🎤 Screen + Microphone')).toBeInTheDocument();
    expect(screen.getByText('🖥️ Screen Only')).toBeInTheDocument();
    expect(screen.getByText('🎤 Audio Only')).toBeInTheDocument();
  });

  it('should change recording mode when selected', () => {
    render(<SimpleRecorder />);
    
    const select = screen.getByDisplayValue('🖥️ + 🎤 Screen + Microphone');
    fireEvent.change(select, { target: { value: 'screen' } });
    
    expect(select).toHaveValue('screen');
  });

  it('should start recording when start button is clicked', async () => {
    render(<SimpleRecorder />);
    
    const startButton = screen.getByText('🔴 Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetDisplayMedia).toHaveBeenCalledWith({
        video: true,
        audio: true
      });
      expect(global.MediaRecorder).toHaveBeenCalled();
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });
  });

  it('should show recording status when recording', async () => {
    render(<SimpleRecorder />);
    
    const startButton = screen.getByText('🔴 Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('⏹️ Stop Recording')).toBeInTheDocument();
      expect(screen.getByText(/Recording in progress/)).toBeInTheDocument();
    });
  });

  it('should handle mic-only recording mode', async () => {
    render(<SimpleRecorder />);
    
    // Change to mic-only mode
    const select = screen.getByDisplayValue('🖥️ + 🎤 Screen + Microphone');
    fireEvent.change(select, { target: { value: 'mic-only' } });
    
    const startButton = screen.getByText('🔴 Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
      expect(mockGetDisplayMedia).not.toHaveBeenCalled();
    });
  });

  it('should handle recording errors gracefully', async () => {
    mockGetDisplayMedia.mockRejectedValue(new Error('Permission denied'));
    
    render(<SimpleRecorder />);
    
    const startButton = screen.getByText('🔴 Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to start recording/)).toBeInTheDocument();
      expect(screen.getByText(/Permission denied/)).toBeInTheDocument();
    });
  });

  it('should call onRecordingComplete when provided', async () => {
    const mockOnComplete = vi.fn();
    render(<SimpleRecorder onRecordingComplete={mockOnComplete} />);
    
    const startButton = screen.getByText('🔴 Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    // Simulate recording completion
    const mockBlob = new Blob(['test'], { type: 'video/webm' });
    if (mockMediaRecorder.onstop) {
      // Simulate data available first
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockBlob });
      }
      mockMediaRecorder.onstop();
    }

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  it('should disable recording mode selector while recording', async () => {
    render(<SimpleRecorder />);
    
    const select = screen.getByDisplayValue('🖥️ + 🎤 Screen + Microphone');
    const startButton = screen.getByText('🔴 Start Recording');
    
    expect(select).not.toBeDisabled();
    
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(select).toBeDisabled();
    });
  });
}); 