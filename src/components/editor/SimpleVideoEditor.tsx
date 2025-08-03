import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Save,
  Close,
  Download,
  Videocam,
  Publish,
} from '@mui/icons-material';

interface SimpleVideoEditorProps {
  videoUrl: string;
  videoTitle: string;
  onSave?: (editedVideo: { url: string; title: string; duration: number }) => void;
  onClose?: () => void;
  onReRecord?: () => void;
}

const SimpleVideoEditor: React.FC<SimpleVideoEditorProps> = ({ 
  videoUrl, 
  videoTitle, 
  onSave, 
  onClose,
  onReRecord 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [editedTitle, setEditedTitle] = useState(videoTitle);
  const [description, setDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setEditedTitle(newTitle);
    setHasChanges(newTitle !== videoTitle);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        url: videoUrl,
        title: editedTitle,
        duration: duration,
      });
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${editedTitle}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReRecord = () => {
    if (onReRecord) {
      onReRecord();
    }
    if (onClose) {
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          🎬 Quick Edit
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Video Preview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: '100%',
            maxHeight: '400px',
            backgroundColor: '#000',
            borderRadius: '8px'
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
        />
        
        {/* Simple Controls */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={isPlaying ? <Pause /> : <PlayArrow />}
            onClick={togglePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Duration: {formatTime(duration)}
          </Typography>
        </Box>
      </Paper>

      {/* Edit Title */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ✏️ Edit Title
        </Typography>
        <TextField
          fullWidth
          label="Video Title"
          value={editedTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          margin="normal"
          helperText="Give your video a descriptive name"
        />
        {hasChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Title changed - don't forget to save!
          </Alert>
        )}
      </Paper>

      {/* Coming Soon Notice */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom color="text.secondary">
          🚧 More Editing Features Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          In future updates, you'll be able to:
        </Typography>
        <ul style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>
          <li><strong>Trim videos</strong> - Cut start and end points</li>
          <li><strong>Add voiceover</strong> - Record audio over existing video</li>
          <li><strong>Add text overlays</strong> - Annotations and callouts</li>
          <li><strong>Picture-in-picture</strong> - Camera overlay on screen recordings</li>
        </ul>
        <Typography variant="body2" color="text.secondary">
          For now, focus on getting great recordings and organizing your library!
        </Typography>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<Videocam />}
          onClick={handleReRecord}
          color="error"
        >
          Re-Record This Demo
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownload}
        >
          Download Video
        </Button>
        
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {hasChanges ? 'Save Changes' : 'No Changes'}
        </Button>
        
        <Button
          variant="contained"
          color="success"
          startIcon={<Publish />}
          onClick={() => setShowPublishDialog(true)}
        >
          Publish to Community
        </Button>
      </Box>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onClose={() => setShowPublishDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish to Community 🌟</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Project Title"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Project Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            placeholder="Describe your project: What did you build? What technologies did you use? What challenges did you overcome? What are you most proud of?"
            helperText="This description will help your peers understand and give better feedback on your work"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Once published, your demo will be visible to the community for peer review and feedback.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPublishDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success"
            disabled={!editedTitle.trim() || !description.trim()}
          >
            Publish Demo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleVideoEditor;