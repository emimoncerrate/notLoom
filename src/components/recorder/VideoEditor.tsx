import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Slider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Divider,
  Tooltip,
  Modal,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  ContentCut,
  Refresh,
  Save,
  Delete,
  Comment,
  Check,
  NavigateNext,
  Videocam,
  Stop,
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface VideoEditorProps {
  videoBlob: Blob;
  onSave: (editedBlob: Blob, notes: string[]) => void;
  onRerecord: () => void;
}

interface TimeRange {
  start: number;
  end: number;
}

interface VideoNote {
  id: string;
  timestamp: number;
  text: string;
  color?: string;
  displayed?: boolean;
}

interface VideoSegment {
  blob: Blob;
  startTime: number;
  endTime: number;
  isRecording?: boolean;
}

interface AudioSegment {
  blob: Blob;
  startTime: number;
  endTime: number;
  isMuted?: boolean;
}

// New edit mode options
type EditMode = 'video' | 'audio';

const VideoEditor: React.FC<VideoEditorProps> = ({ videoBlob, onSave, onRerecord }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<TimeRange>({ start: 0, end: 100 });
  const [selectionRange, setSelectionRange] = useState<TimeRange | null>(null);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [displayedNote, setDisplayedNote] = useState<VideoNote | null>(null);
  
  // State for segment management and re-recording
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [isRerecording, setIsRerecording] = useState(false);
  const [isAudioRerecording, setIsAudioRerecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // New state for edit mode selection
  const [editMode, setEditMode] = useState<EditMode>('video');
  
  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Audio context for processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  
  // Initialize video when blob changes
  useEffect(() => {
    if (videoRef.current && videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      videoRef.current.src = url;
      
      // Initialize with a single segment for the whole video
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          const fullDuration = videoRef.current.duration;
          setVideoSegments([
            {
              blob: videoBlob,
              startTime: 0,
              endTime: fullDuration
            }
          ]);
        }
      };
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoBlob]);
  
  // Update current time while playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handleDurationChange = () => {
      setDuration(video.duration);
      setTrimRange({ start: 0, end: video.duration });
    };
    
    const handlePlayPause = () => {
      setPlaying(!video.paused);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlayPause);
    video.addEventListener('pause', handlePlayPause);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlayPause);
      video.removeEventListener('pause', handlePlayPause);
    };
  }, []);

  // Function to combine multiple MediaStreams into a single stream
  const combineStreams = (videoStream: MediaStream, audioStream: MediaStream): MediaStream => {
    // Create a new MediaStream to hold both video and audio tracks
    const combinedStream = new MediaStream();
    
    // Add all video tracks from the screen capture
    videoStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    // Add all audio tracks from the microphone
    audioStream.getAudioTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    return combinedStream;
  };
  
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };
  
  const handleSeek = (_event: Event, newValue: number | number[]) => {
    const time = newValue as number;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleTrimRangeChange = (_event: Event, newValue: number | number[]) => {
    const [start, end] = newValue as number[];
    setTrimRange({ start, end });
  };
  
  const handleCreateSelection = () => {
    if (selectionRange) {
      setSelectionRange(null);
    } else {
      setSelectionRange({ start: currentTime, end: Math.min(currentTime + 10, duration) });
    }
  };
  
  const handleSelectionRangeChange = (_event: Event, newValue: number | number[]) => {
    if (!selectionRange) return;
    const [start, end] = newValue as number[];
    setSelectionRange({ start, end });
  };
  
  const startRecordingSection = async () => {
    if (!selectionRange) return;
    
    setIsRerecording(true);
    setRecording(false);
    setRecordingTime(0);
    setProcessingError(null);
    
    try {
      // 1. Capture screen (video only)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      
      // Store a reference to the screen stream to stop tracks later
      streamRef.current = screenStream;

      // 2. If audio is enabled, capture microphone audio
      let combinedStream = screenStream;
      
      if (audioEnabled) {
        try {
          // Request microphone access
          const micStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          
          // Store microphone stream to stop tracks later
          micStreamRef.current = micStream;
          
          // Combine screen and microphone streams
          combinedStream = combineStreams(screenStream, micStream);
          
        } catch (micError) {
          console.error('Failed to access microphone:', micError);
          setProcessingError('Microphone access denied. Recording will continue without audio.');
        }
      }
      
      // Create MediaRecorder with available types
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: '' };
          }
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const replacementBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Insert the recorded segment in place of the deleted section
        handleReplaceSegment(replacementBlob);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Start a timer to track recording duration
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.start(1000); // Capture in 1-second chunks
      setRecording(true);
    } catch (err) {
      setProcessingError('Failed to start recording. Please ensure you have granted the necessary permissions.');
      console.error('Recording error:', err);
      setIsRerecording(false);
    }
  };
  
  const stopRecordingSection = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks from screen capture stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop all tracks from microphone stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Create a MediaSource with video segments
  const createMediaSourceFromSegments = async (segments: VideoSegment[]): Promise<string> => {
    console.log(`Processing ${segments.length} segments. First segment size: ${segments[0]?.blob?.size || 'unknown'}`);
    
    // If no segments, return empty blob
    if (!segments.length) {
      console.warn('No segments to process');
      return URL.createObjectURL(new Blob([], { type: 'video/webm' }));
    }
    
    return new Promise((resolve, reject) => {
      // Set an overall timeout to prevent hangs
      const globalTimeoutId = setTimeout(() => {
        console.error('MediaSource processing timed out after 60 seconds');
        reject(new Error('Video processing timed out. Try with smaller segments or a different browser.'));
      }, 60000); // 60 second timeout
      
      try {
        // Helper function to clean up resources in one place
        const cleanupAndReject = (error: Error) => {
          console.error('MediaSource error:', error);
          clearTimeout(globalTimeoutId);
          URL.revokeObjectURL(videoElement.src);
          video.remove();
          reject(error);
        };

        // Create MediaSource and video element for processing
        const mediaSource = new MediaSource();
        const videoElement = document.createElement('video');
        videoElement.controls = false;
        videoElement.muted = true;
        videoElement.preload = 'auto';
        
        // Create offscreen video for processing
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        
        video.src = URL.createObjectURL(mediaSource);
        
        // Track key events for debugging
        let sourceOpenFired = false;
        let sourceEndedFired = false;
        let updateEndCount = 0;
        
        mediaSource.addEventListener('sourceopen', async () => {
          console.log('MediaSource: sourceopen event fired');
          sourceOpenFired = true;
          
          try {
            // Get the first segment to determine mime type
            const firstSegment = segments[0];
            if (!firstSegment || !firstSegment.blob) {
              throw new Error('First segment is invalid');
            }
            
            // Create source buffer
            const mimeType = 'video/webm; codecs="vp8,opus"';
            if (!MediaSource.isTypeSupported(mimeType)) {
              throw new Error(`This browser doesn't support the required video format: ${mimeType}`);
            }
            
            const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
            
            // Ensure sourceBuffer is created
            if (!sourceBuffer) {
              throw new Error('Failed to create sourceBuffer');
            }
            
            console.log('MediaSource: sourceBuffer created');
            
            // Process segments sequentially
            let currentSegmentIndex = 0;
            
            // Function to append next segment
            const appendNextSegment = async () => {
              if (currentSegmentIndex >= segments.length) {
                console.log('MediaSource: All segments processed');
                
                try {
                  // Only end the media source if it's not already ended
                  if (mediaSource.readyState === 'open') {
                    console.log('MediaSource: Ending media source');
                    mediaSource.endOfStream();
                  }
                } catch (endError) {
                  console.error('MediaSource: Error ending stream:', endError);
                }
                return;
              }
              
              const segment = segments[currentSegmentIndex];
              
              if (!segment || !segment.blob || segment.blob.size === 0) {
                console.warn(`MediaSource: Skipping empty segment at index ${currentSegmentIndex}`);
                currentSegmentIndex++;
                appendNextSegment();
                return;
              }
              
              console.log(`MediaSource: Processing segment ${currentSegmentIndex + 1}/${segments.length}, size: ${segment.blob.size} bytes`);
              
              try {
                // Convert blob to ArrayBuffer
                const arrayBuffer = await segment.blob.arrayBuffer();
                
                // Only append if not already updating
                if (sourceBuffer.updating) {
                  console.warn('MediaSource: SourceBuffer is already updating. Waiting...');
                  return; // The updateend handler will call appendNextSegment
                }
                
                sourceBuffer.appendBuffer(arrayBuffer);
                currentSegmentIndex++;
              } catch (appendError) {
                console.error(`MediaSource: Error appending segment ${currentSegmentIndex}:`, appendError);
                cleanupAndReject(new Error(`Failed to append segment ${currentSegmentIndex}: ${appendError.message}`));
              }
            };
            
            // Handle sourceBuffer events
            sourceBuffer.addEventListener('updateend', () => {
              updateEndCount++;
              console.log(`MediaSource: updateend fired (${updateEndCount}/${segments.length})`);
              appendNextSegment();
            });
            
            sourceBuffer.addEventListener('error', (e) => {
              console.error('MediaSource: SourceBuffer error:', e);
              cleanupAndReject(new Error('SourceBuffer error occurred'));
            });
            
            // Handle MediaSource events
            mediaSource.addEventListener('sourceended', () => {
              console.log('MediaSource: sourceended event fired');
              sourceEndedFired = true;
            });
            
            mediaSource.addEventListener('error', (e) => {
              console.error('MediaSource: MediaSource error:', e);
              cleanupAndReject(new Error('MediaSource error occurred'));
            });
            
            // Start processing segments
            appendNextSegment();
          } catch (error) {
            cleanupAndReject(error);
          }
        });
        
        mediaSource.addEventListener('sourceclose', () => {
          console.log('MediaSource: sourceclose event fired');
        });
        
        // Handle the case where mediaSource is successfully ended
        mediaSource.addEventListener('sourceended', async () => {
          console.log('MediaSource: Recording completed');
          
          try {
            // Use MediaRecorder to capture the video element's output
            const stream = video.captureStream();
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];
            
            recorder.ondataavailable = event => {
              if (event.data.size > 0) {
                chunks.push(event.data);
              }
            };
            
            recorder.onstop = () => {
              clearTimeout(globalTimeoutId);
              const blob = new Blob(chunks, { type: 'video/webm' });
              
              if (blob.size === 0) {
                console.error('MediaSource: Generated blob is empty');
                cleanupAndReject(new Error('Generated video is empty'));
                return;
              }
              
              console.log(`MediaSource: Final blob created, size: ${blob.size} bytes`);
              URL.revokeObjectURL(video.src);
              video.remove();
              
              const url = URL.createObjectURL(blob);
              resolve(url);
            };
            
            // Set up a timeout for the recording
            const recordingTimeoutId = setTimeout(() => {
              if (recorder.state === 'recording') {
                console.warn('MediaSource: Recording timeout, stopping recorder');
                recorder.stop();
              }
            }, 30000); // 30 second timeout
            
            // Start recording
            recorder.start();
            
            // Must seek to 0 and play the video to capture it
            video.currentTime = 0;
            video.oncanplay = () => {
              console.log('MediaSource: Video can play, starting playback');
              const playPromise = video.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => console.log('MediaSource: Playback started'))
                  .catch(e => {
                    console.error('MediaSource: Playback failed:', e);
                    clearTimeout(recordingTimeoutId);
                    recorder.stop();
                    cleanupAndReject(new Error('Failed to play the video for recording'));
                  });
              }
            };
            
            video.onended = () => {
              console.log('MediaSource: Video playback ended, stopping recorder');
              clearTimeout(recordingTimeoutId);
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            };
            
            // Additional check to ensure recording completes
            setTimeout(() => {
              // If after 5 seconds, we haven't fired the events, check state
              if (!sourceEndedFired) {
                console.warn('MediaSource: sourceended never fired. Current state:', {
                  sourceOpenFired,
                  sourceEndedFired,
                  updateEndCount,
                  mediaSourceState: mediaSource.readyState
                });
                
                // If update events have completed but sourceended didn't fire
                if (updateEndCount >= segments.length && mediaSource.readyState === 'open') {
                  console.log('MediaSource: All segments processed but sourceended never fired, forcing endOfStream');
                  try {
                    mediaSource.endOfStream();
                  } catch (e) {
                    console.error('MediaSource: Error forcing endOfStream:', e);
                  }
                }
              }
              
              // If video should have ended but recorder is still recording
              if (recorder.state === 'recording' && !video.paused && video.currentTime >= video.duration - 0.5) {
                console.warn('MediaSource: Video playback seems complete but recorder still running, stopping recorder');
                recorder.stop();
              }
            }, 5000);
          } catch (recordError) {
            cleanupAndReject(new Error(`Recording failed: ${recordError.message}`));
          }
        });
      } catch (error) {
        clearTimeout(globalTimeoutId);
        reject(error);
      }
    });
  };
  
  // Delete selected section and prepare for re-recording
  const handleDeleteSection = async () => {
    if (!selectionRange) return;
    
    setIsProcessing(true);
    setProcessingMessage('Processing video segments...');
    setProcessingError(null);
    
    try {
      console.log('Starting section deletion for range:', selectionRange.start, 'to', selectionRange.end);
      
      // 1. Split the video into three segments (before, selected section, after)
      const beforeSegments = videoSegments.filter(segment => 
        segment.endTime <= selectionRange.start
      );
      console.log('Before segments:', beforeSegments.length);
      
      const afterSegments = videoSegments.filter(segment => 
        segment.startTime >= selectionRange.end
      );
      console.log('After segments:', afterSegments.length);
      
      // Adjust timings for segments after the cut to maintain continuity
      const timeDifference = selectionRange.end - selectionRange.start;
      const adjustedAfterSegments = afterSegments.map(segment => {
        console.log('Adjusting segment timing:', segment.startTime, '->', segment.startTime - timeDifference);
        return {
          ...segment,
          startTime: segment.startTime - timeDifference,
          endTime: segment.endTime - timeDifference
        };
      });
      
      // 2. Update the segments (removing the selected range)
      const newSegments = [...beforeSegments, ...adjustedAfterSegments];
      console.log('New segments after deletion:', newSegments.length);
      
      if (newSegments.length === 0) {
        throw new Error('No valid segments remain after deletion');
      }
      
      setVideoSegments(newSegments);
      
      // Use a timeout to limit how long we wait for preview creation
      const timeoutId = setTimeout(() => {
        console.error('Preview creation timed out');
        setProcessingError('Preview creation timed out. Proceeding with re-recording.');
        setIsPreviewReady(false);
        startRecordingSection();
      }, 15000); // 15 second timeout
      
      try {
        // 3. Create a preview of the edited video (without the selected section)
        console.log('Creating preview with merged segments');
        const previewUrl = await createMediaSourceFromSegments(newSegments);
        clearTimeout(timeoutId);
        
        if (previewVideoRef.current) {
          console.log('Setting preview video source');
          previewVideoRef.current.src = previewUrl;
          previewVideoRef.current.load();
          setIsPreviewReady(true);
        }
        
        setProcessingMessage('Section removed successfully. You can now re-record this section.');
      } catch (previewError) {
        console.error('Preview creation failed:', previewError);
        clearTimeout(timeoutId);
        
        // Continue even if preview fails
        setProcessingMessage('Preview creation failed, but you can still re-record this section.');
        setIsPreviewReady(false);
      }
      
      // Prepare for re-recording regardless of preview success
      console.log('Starting recording section');
      startRecordingSection();
    } catch (error) {
      console.error('Error processing video segments:', error);
      setProcessingError(`Failed to process video segments: ${error.message || 'Unknown error'}`);
      setIsProcessing(false);
      
      // Offer a reset option
      if (confirm('Video processing failed. Would you like to reset the editor and try again?')) {
        // Reset the editor state
        if (videoRef.current && videoBlob) {
          const url = URL.createObjectURL(videoBlob);
          videoRef.current.src = url;
          videoRef.current.load();
          setSelectionRange(null);
          setVideoSegments([{
            blob: videoBlob,
            startTime: 0,
            endTime: duration
          }]);
        }
      }
    }
  };
  
  // Replace selected section with new recording
  const handleReplaceSegment = async (newSegmentBlob: Blob) => {
    if (!selectionRange) return;
    
    setProcessingMessage('Finalizing your edited video...');
    setIsProcessing(true);
    
    try {
      console.log('Replacing segment with new recording, blob size:', newSegmentBlob.size);
      
      // Validate the new blob
      if (!newSegmentBlob || newSegmentBlob.size === 0) {
        throw new Error('The recorded segment is empty or invalid');
      }
      
      // Create a new segment for the newly recorded section
      const newSegment: VideoSegment = {
        blob: newSegmentBlob,
        startTime: selectionRange.start,
        endTime: selectionRange.end,
        isRecording: false
      };
      
      // Find segments before and after the selection
      const beforeSegments = videoSegments.filter(segment => 
        segment.endTime <= selectionRange.start
      );
      console.log('Before segments for replacement:', beforeSegments.length);
      
      const afterSegments = videoSegments.filter(segment => 
        segment.startTime >= selectionRange.end
      );
      console.log('After segments for replacement:', afterSegments.length);
      
      // Combine all segments
      const allSegments = [...beforeSegments, newSegment, ...afterSegments];
      console.log('All segments after replacement:', allSegments.length);
      
      // Update segments array
      setVideoSegments(allSegments);
      
      // Use a timeout to limit how long we wait for video creation
      const timeoutId = setTimeout(() => {
        console.error('Video finalization timed out');
        setProcessingError('Video processing took too long. Try using smaller segments or a different browser.');
        setIsProcessing(false);
        setSelectionRange(null);
        setIsRerecording(false);
      }, 30000); // 30 second timeout
      
      try {
        // Create the final video with all segments
        console.log('Creating final video with merged segments');
        const finalVideoUrl = await createMediaSourceFromSegments(allSegments);
        clearTimeout(timeoutId);
        
        if (videoRef.current) {
          console.log('Setting main video source');
          videoRef.current.src = finalVideoUrl;
          videoRef.current.load();
        }
        
        // Clean up and reset state
        setSelectionRange(null);
        setIsRerecording(false);
        setIsProcessing(false);
      } catch (videoError) {
        console.error('Final video creation failed:', videoError);
        clearTimeout(timeoutId);
        
        // Provide a more helpful error message
        setProcessingError('Failed to create the final video. Consider using FFmpeg.wasm for more reliable processing.');
        setIsProcessing(false);
        setIsRerecording(false);
      }
    } catch (error) {
      console.error('Error finalizing video:', error);
      setProcessingError(`Failed to finalize video: ${error.message || 'Unknown error'}`);
      setIsProcessing(false);
      setIsRerecording(false);
    }
  };
  
  const handleRerecordSection = () => {
    if (!selectionRange) return;
    handleDeleteSection();
  };
  
  const handleAddNote = () => {
    if (newNote.trim()) {
      const newId = `note-${Date.now()}`;
      setNotes([...notes, {
        id: newId,
        timestamp: currentTime,
        text: newNote.trim()
      }]);
      setNewNote('');
      setIsAddingNote(false);
    }
  };
  
  // Function to handle note display during video playback
  useEffect(() => {
    // Find any notes that should be displayed at the current time
    const findNoteAtCurrentTime = () => {
      // Check if there are any notes at the current timestamp
      const currentNotes = notes.filter(note => {
        // Show notes within 0.5 seconds of their timestamp
        return Math.abs(note.timestamp - currentTime) < 0.5;
      });
      
      if (currentNotes.length > 0) {
        setDisplayedNote(currentNotes[0]);
        // Hide note after 3 seconds
        setTimeout(() => {
          setDisplayedNote(null);
        }, 3000);
      }
    };
    
    if (playing) {
      findNoteAtCurrentTime();
    }
  }, [currentTime, notes, playing]);
  
  // Function to extract audio from a video blob
  const extractAudioFromVideo = async (videoBlob: Blob): Promise<AudioBuffer> => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        // Create a video element to process the blob
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(videoBlob);
        
        // Set up media source
        const mediaSource = new MediaSource();
        videoElement.src = URL.createObjectURL(mediaSource);
        
        mediaSource.addEventListener('sourceopen', async () => {
          try {
            // Create a temporary audio context
            const audioContext = audioContextRef.current as AudioContext;
            
            // Create a media element source from the video
            const source = audioContext.createMediaElementSource(videoElement);
            
            // Create a destination to capture the audio data
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            
            // Start playing the video to get the audio
            videoElement.play();
            
            // Wait for the video to start playing
            await new Promise(resolve => {
              videoElement.onplaying = resolve;
            });
            
            // Record the audio stream
            const recorder = new MediaRecorder(destination.stream);
            const chunks: Blob[] = [];
            
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.push(e.data);
              }
            };
            
            recorder.onstop = async () => {
              // Create audio blob
              const audioBlob = new Blob(chunks, { type: 'audio/webm' });
              
              // Convert to audio buffer
              const arrayBuffer = await audioBlob.arrayBuffer();
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
              
              // Clean up
              URL.revokeObjectURL(videoElement.src);
              
              resolve(audioBuffer);
            };
            
            // Start recording
            recorder.start();
            
            // Stop recording when the video ends
            videoElement.onended = () => {
              recorder.stop();
              videoElement.pause();
            };
            
            // Set video to end after we've captured its full duration
            videoElement.currentTime = 0;
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // Function to combine audio segments
  const processAudioSegments = async (
    originalAudioBuffer: AudioBuffer,
    newAudioSegments: AudioSegment[],
    totalDuration: number
  ): Promise<AudioBuffer> => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const audioContext = audioContextRef.current;
    
    // Create a new buffer for the combined audio
    const outputBuffer = audioContext.createBuffer(
      originalAudioBuffer.numberOfChannels,
      audioContext.sampleRate * totalDuration,
      audioContext.sampleRate
    );
    
    // Copy original audio to output buffer
    for (let channel = 0; channel < originalAudioBuffer.numberOfChannels; channel++) {
      const originalData = originalAudioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Copy original data to output
      outputData.set(originalData);
    }
    
    // Process each new audio segment
    for (const segment of newAudioSegments) {
      try {
        // Convert segment blob to audio buffer
        const arrayBuffer = await segment.blob.arrayBuffer();
        const segmentBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Calculate start sample and duration in samples
        const startSample = Math.floor(segment.startTime * audioContext.sampleRate);
        const segmentDuration = Math.min(
          segmentBuffer.length,
          Math.floor((segment.endTime - segment.startTime) * audioContext.sampleRate)
        );
        
        // Replace audio in the output buffer with the segment data
        for (let channel = 0; channel < Math.min(outputBuffer.numberOfChannels, segmentBuffer.numberOfChannels); channel++) {
          const segmentData = segmentBuffer.getChannelData(channel);
          const outputData = outputBuffer.getChannelData(channel);
          
          // Clear the original audio in this segment (mute it)
          for (let i = 0; i < segmentDuration; i++) {
            if (startSample + i < outputData.length) {
              outputData[startSample + i] = 0;
            }
          }
          
          // Copy new segment data
          for (let i = 0; i < segmentDuration; i++) {
            if (startSample + i < outputData.length && i < segmentData.length) {
              outputData[startSample + i] = segmentData[i];
            }
          }
        }
      } catch (error) {
        console.error('Error processing audio segment:', error);
        // Continue with other segments if one fails
      }
    }
    
    return outputBuffer;
  };
  
  // Function to combine video with new audio
  const combineVideoWithAudio = async (videoBlob: Blob, audioBuffer: AudioBuffer): Promise<Blob> => {
    // This is a simplified version - in a real application, this would be more complex
    // and might require a server-side component or a more specialized library
    
    // Create a temporary audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const audioContext = audioContextRef.current;
    
    // Convert AudioBuffer to a blob
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    // Render the audio
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert rendered buffer to WAV format
    const wavBlob = await audioBufferToWav(renderedBuffer);
    
    // Here we would normally use a library like ffmpeg.wasm to combine 
    // the video with the new audio. For simplicity, we'll just return
    // the original video blob and simulate the process.
    
    // Return original video as placeholder
    // In a real implementation, this would return the video with new audio
    return videoBlob;
  };
  
  // Helper function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
    // This is a simplified version - a real implementation would use
    // a proper library for audio encoding
    
    return new Promise((resolve) => {
      // Simulate processing
      setTimeout(() => {
        // Return a dummy blob as placeholder
        resolve(new Blob([], { type: 'audio/wav' }));
      }, 500);
    });
  };
  
  // Update handleFinishEditing with more robust error handling
  const handleFinishEditing = async () => {
    if (!videoBlob || !videoSegments.length) {
      toast({
        title: "No video to save",
        description: "There are no video segments to process",
        status: "error",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Processing video segments...");
    setProcessingError(null);
    
    try {
      // Process video segments with detailed logging
      const finalBlob = await createMediaSourceFromSegments(videoSegments);
      console.log(`Final video created successfully, size: ${finalBlob.size} bytes`);
      
      if (!finalBlob || finalBlob.size === 0) {
        throw new Error("Processed video is empty");
      }
      
      // Create file object with original filename but processed content
      const originalFilename = videoBlob.name.split('/').pop() || 'recorded_video.webm';
      const newFilename = originalFilename.replace(/\.[^/.]+$/, "") + "_edited.webm";
      const finalVideo = new File([finalBlob], newFilename, { type: "video/webm" });
      
      console.log(`Created final File object: ${finalVideo.name}, size: ${finalVideo.size} bytes`);
      onSave(finalVideo, notes.map(note => `${formatTime(note.timestamp)} - ${note.text}`));
      
      // Reset processing state
      setIsProcessing(false);
      setProcessingMessage(null);
    } catch (error) {
      console.error("Video processing failed:", error);
      setProcessingError(`Processing failed: ${error.message || "Unknown error"}`);
      toast({
        title: "Video processing failed",
        description: error.message || "An unexpected error occurred",
        status: "error",
        duration: 5000,
      });
      setIsProcessing(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Function to handle edit mode change
  const handleEditModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: EditMode | null) => {
    if (newMode !== null) {
      setEditMode(newMode);
      // Clear any existing selection when changing modes
      setSelectionRange(null);
    }
  };
  
  // Audio-only re-recording functions
  const startAudioRecording = async () => {
    if (!selectionRange) return;
    
    setIsAudioRerecording(true);
    setRecording(false);
    setRecordingTime(0);
    setProcessingError(null);
    
    try {
      // Only capture microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      // Store reference for cleanup
      micStreamRef.current = micStream;
      
      // Create MediaRecorder
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: '' };
      }
      
      const mediaRecorder = new MediaRecorder(micStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Insert the recorded audio
        handleReplaceAudio(audioBlob);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start a timer to track recording duration
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          // Stop recording if we exceed the selection range duration
          if (selectionRange && prev >= (selectionRange.end - selectionRange.start)) {
            stopAudioRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // If preview video exists, seek to start of selection and play during recording
      if (previewVideoRef.current && selectionRange) {
        previewVideoRef.current.currentTime = selectionRange.start;
        previewVideoRef.current.play();
      }
      
      mediaRecorder.start(1000);
      setRecording(true);
    } catch (err) {
      setProcessingError('Failed to start audio recording. Please ensure you have granted microphone permissions.');
      console.error('Audio recording error:', err);
      setIsAudioRerecording(false);
    }
  };
  
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      // Stop microphone stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Pause preview video if playing
      if (previewVideoRef.current) {
        previewVideoRef.current.pause();
      }
      
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Function to prepare for audio re-recording
  const handleAudioRerecord = async () => {
    if (!selectionRange) return;
    
    setIsProcessing(true);
    setProcessingMessage('Preparing for audio re-recording...');
    setProcessingError(null);
    
    try {
      // Create a preview video that shows the original video
      // We'll use this to help the user sync their new audio recording
      if (videoRef.current) {
        // Create a preview URL from the current state of the video
        const videoUrl = videoRef.current.src;
        
        if (previewVideoRef.current) {
          previewVideoRef.current.src = videoUrl;
          previewVideoRef.current.load();
          setIsPreviewReady(true);
        }
      }
      
      setProcessingMessage('Ready to record new audio for the selected section.');
      setIsAudioRerecording(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error preparing for audio re-recording:', error);
      setProcessingError('Failed to prepare for audio re-recording. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Function to handle replacing the audio
  const handleReplaceAudio = async (newAudioBlob: Blob) => {
    if (!selectionRange) return;
    
    setProcessingMessage('Processing new audio...');
    setIsProcessing(true);
    
    try {
      // Create a new audio segment
      const newAudioSegment: AudioSegment = {
        blob: newAudioBlob,
        startTime: selectionRange.start,
        endTime: selectionRange.end
      };
      
      // Add this to our audio segments
      const updatedAudioSegments = [...audioSegments, newAudioSegment];
      setAudioSegments(updatedAudioSegments);
      
      // This is where we would combine the original video with the new audio
      // For now, we're just storing the segments and will handle the combination
      // when finalizing the video
      
      // Clean up and reset state
      setSelectionRange(null);
      setIsAudioRerecording(false);
      setIsProcessing(false);
      
      // Show success message
      setProcessingMessage('Audio successfully re-recorded!');
      setTimeout(() => setProcessingMessage(''), 3000);
    } catch (error) {
      console.error('Error replacing audio:', error);
      setProcessingError('Failed to process new audio. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Add global error boundary to catch unhandled errors
  useEffect(() => {
    const handleGlobalError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      if (isProcessing) {
        setProcessingError('An unexpected error occurred. Try again with a smaller video or different browser.');
        setIsProcessing(false);
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, [isProcessing]);
  
  // Add unhandled rejection handler
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (isProcessing) {
        setProcessingError('An async operation failed. Try with a smaller video or different browser.');
        setIsProcessing(false);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [isProcessing]);
  
  // Audio re-recording UI
  if (isAudioRerecording) {
    return (
      <Box sx={{ width: '100%' }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom align="center">
            Recording Audio for Selected Section
          </Typography>
          
          {processingError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {processingError}
            </Alert>
          )}
          
          {/* Preview of video during audio recording */}
          {isPreviewReady && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Video Preview - Watch to sync your audio
              </Typography>
              <video
                ref={previewVideoRef}
                controls
                style={{ width: '100%', borderRadius: 8, maxHeight: '300px' }}
                muted={recording} // Mute during recording to prevent feedback
              />
            </Box>
          )}
          
          {/* Recording status */}
          <Box 
            sx={{ 
              width: '100%', 
              height: 100, 
              bgcolor: 'rgba(0,0,0,0.1)', 
              mb: 3,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {recording ? (
              <Box sx={{ 
                position: 'relative', 
                width: '100%', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mic fontSize="large" color="error" />
                <Typography variant="caption" sx={{ bgcolor: 'error.main', color: 'white', px: 1, py: 0.5, borderRadius: 1, mt: 1 }}>
                  RECORDING AUDIO {formatTime(recordingTime)} / {selectionRange ? formatTime(selectionRange.end - selectionRange.start) : '00:00'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Speak into your microphone. Recording will automatically stop at the end of the selected segment.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  {isProcessing 
                    ? processingMessage
                    : "Click 'Start Recording' to capture new audio for this section"}
                </Typography>
                {isProcessing && <CircularProgress size={24} sx={{ mt: 1 }} />}
              </Box>
            )}
          </Box>
          
          {/* Recording controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!recording ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Mic />}
                onClick={startAudioRecording}
                disabled={isProcessing}
              >
                Start Audio Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={stopAudioRecording}
              >
                Stop Recording
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={() => {
                setIsAudioRerecording(false);
                setSelectionRange(null);
              }}
              disabled={recording || isProcessing}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Main video editor UI (updated with audio/video toggle)
  return (
    <Box sx={{ width: '100%' }}>
      {processingError && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                setProcessingError(null);
                // Reset state if needed
                if (isRerecording || isAudioRerecording) {
                  setIsRerecording(false);
                  setIsAudioRerecording(false);
                  setSelectionRange(null);
                }
              }}
            >
              Dismiss
            </Button>
          }
        >
          {processingError}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Debug information: Browser: {navigator.userAgent}, Segments: {videoSegments.length}, Audio segments: {audioSegments.length}
          </Typography>
        </Alert>
      )}

      {isProcessing && (
        <Modal
          open={isProcessing}
          aria-labelledby="processing-modal-title"
          aria-describedby="processing-modal-description"
        >
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography id="processing-modal-title" variant="h6" component="h2">
              Processing Video
            </Typography>
            <Typography id="processing-modal-description" sx={{ mt: 2 }}>
              {processingMessage}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
              This may take a while for larger videos
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              sx={{ mt: 2 }}
              onClick={() => {
                // Force cancel processing
                setIsProcessing(false);
                setProcessingError('Processing cancelled by user');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Modal>
      )}
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {isProcessing && (
          <Modal
            open={isProcessing}
            aria-labelledby="processing-modal-title"
            aria-describedby="processing-modal-description"
          >
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography id="processing-modal-title" variant="h6" component="h2">
                Processing Video
              </Typography>
              <Typography id="processing-modal-description" sx={{ mt: 2 }}>
                {processingMessage}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                This may take a while for larger videos
              </Typography>
              {processingError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {processingError}
                </Alert>
              )}
              <Button 
                variant="outlined" 
                color="error" 
                sx={{ mt: 2 }}
                onClick={() => {
                  // Force cancel processing
                  setIsProcessing(false);
                  setProcessingError('Processing cancelled by user');
                }}
              >
                Cancel
              </Button>
            </Box>
          </Modal>
        )}
        
        <Typography variant="h6" gutterBottom align="center">
          Review & Edit Your Recording
        </Typography>
        
        {/* Video Preview with Notes Overlay */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          <video
            ref={videoRef}
            controls={false}
            style={{ width: '100%', borderRadius: 8, maxHeight: '400px' }}
          />
          
          {/* Notes overlay */}
          {displayedNote && (
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: '10%', 
                left: '5%', 
                maxWidth: '90%',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                p: 1,
                borderRadius: 2,
                animation: 'fadeIn 0.3s'
              }}
            >
              <Typography variant="body2">{displayedNote.text}</Typography>
            </Box>
          )}
        </Box>
        
        {/* Playback Controls */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePlayPause}>
            {playing ? <Pause /> : <PlayArrow />}
          </IconButton>
          <Box sx={{ flex: 1, mx: 2 }}>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleSeek}
              valueLabelDisplay="auto"
              valueLabelFormat={formatTime}
            />
          </Box>
          <Typography variant="body2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
        </Box>
        
        {/* Trim Controls */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Trim Video
          </Typography>
          <Slider
            value={[trimRange.start, trimRange.end]}
            max={duration}
            onChange={handleTrimRangeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={formatTime}
            disableSwap
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">Start: {formatTime(trimRange.start)}</Typography>
            <Typography variant="caption">End: {formatTime(trimRange.end)}</Typography>
          </Box>
        </Box>
        
        {/* Section Editing with Mode Toggle */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2">
              Edit Sections
            </Typography>
            
            <ToggleButtonGroup
              value={editMode}
              exclusive
              onChange={handleEditModeChange}
              size="small"
            >
              <ToggleButton value="video">
                <Tooltip title="Edit video and audio together">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Videocam fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">Video + Audio</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="audio">
                <Tooltip title="Edit audio only">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VolumeUp fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">Audio Only</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              variant={selectionRange ? "contained" : "outlined"}
              startIcon={<ContentCut />}
              onClick={handleCreateSelection}
              sx={{ mr: 2 }}
            >
              {selectionRange ? "Cancel Selection" : "Select Section"}
            </Button>
            
            {selectionRange && editMode === 'video' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRerecordSection}
                  sx={{ mr: 2 }}
                >
                  Delete & Re-record
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteSection}
                >
                  Delete Section
                </Button>
              </>
            )}
            
            {selectionRange && editMode === 'audio' && (
              <Button
                variant="outlined"
                startIcon={<Mic />}
                onClick={handleAudioRerecord}
                sx={{ mr: 2 }}
              >
                Re-record Audio Only
              </Button>
            )}
          </Box>
          
          {selectionRange && (
            <Box sx={{ mb: 2 }}>
              <Slider
                value={[selectionRange.start, selectionRange.end]}
                max={duration}
                onChange={handleSelectionRangeChange}
                valueLabelDisplay="auto"
                valueLabelFormat={formatTime}
                disableSwap
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Start: {formatTime(selectionRange.start)}</Typography>
                <Typography variant="caption">End: {formatTime(selectionRange.end)}</Typography>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Notes */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Video Notes
          </Typography>
          
          {notes.length > 0 ? (
            <Box sx={{ mb: 2, maxHeight: '150px', overflowY: 'auto' }}>
              {notes.map(note => (
                <Box key={note.id} sx={{ display: 'flex', mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ mr: 2, minWidth: '40px', color: 'primary.main' }}>
                    {formatTime(note.timestamp)}
                  </Typography>
                  <Typography variant="body2">{note.text}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No notes added yet. Add notes to remember important points.
            </Typography>
          )}
          
          {isAddingNote ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter note at current timestamp..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                autoFocus
                sx={{ mr: 1 }}
              />
              <IconButton color="primary" onClick={handleAddNote}>
                <Check />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Comment />}
              onClick={() => setIsAddingNote(true)}
            >
              Add Note at {formatTime(currentTime)}
            </Button>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRerecord}
          >
            Re-record Entirely
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<NavigateNext />}
            onClick={handleFinishEditing}
          >
            Save & Continue
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default VideoEditor; 