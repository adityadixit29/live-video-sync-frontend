import React, { useRef, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config';
import './VideoPlayer.css';

const VideoPlayer = ({ unique_id, isAdmin, socket }) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoSource, setVideoSource] = useState('');
  const [hasVideoSource, setHasVideoSource] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    // Note: Video state request is now handled in Session component
    // This ensures proper timing and avoids duplicate requests

    // Listen for video state sync (when joining late)
    // Students get the video source but have full independent control
    socket.on('video-state-sync', (data) => {
      if (!isAdmin && videoRef.current && data.src) {
        console.log('Received video state sync:', data.src);
        isSyncingRef.current = true;
        setVideoSource(data.src); // Set state first
        setHasVideoSource(true); // Mark that video source is available
        
        // Handle video loading with error handling
        const handleError = () => {
          console.error('Error loading video:', data.src);
          isSyncingRef.current = false;
          alert('Error loading video. Please check if the video file is accessible.');
        };
        
        const handleCanPlay = () => {
          // Students have full control - don't auto-play or sync time/volume
          // Just load the video and let them control it
          isSyncingRef.current = false;
          console.log('Video loaded and ready for student');
        };
        
        videoRef.current.addEventListener('error', handleError, { once: true });
        videoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
        videoRef.current.src = data.src;
        videoRef.current.load();
      }
    });

    // Students have full independent control - no automatic sync of play/pause/time/volume
    // Only video source is synced (when admin uploads a video)
    // Students can control playback independently

    socket.on('video-source-change', (data) => {
      if (!isAdmin && videoRef.current && data.src) {
        console.log('Received video source change:', data.src);
        isSyncingRef.current = true;
        setVideoSource(data.src); // Set state first to hide placeholder
        setHasVideoSource(true); // Mark that video source is available
        
        // Handle video loading with error handling
        const handleError = () => {
          console.error('Error loading video:', data.src);
          isSyncingRef.current = false;
          alert('Error loading video. Please check if the video file is accessible.');
        };
        
        const handleCanPlay = () => {
          // Just load the video - students control play/pause/seek/volume themselves
          isSyncingRef.current = false;
          console.log('Video loaded and ready for student');
        };
        
        videoRef.current.addEventListener('error', handleError, { once: true });
        videoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
        videoRef.current.src = data.src;
        videoRef.current.load();
      }
    });

    return () => {
      socket.off('video-source-change');
      socket.off('video-state-sync');
    };
  }, [socket, isAdmin, unique_id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      // Students have independent time control - no automatic sync
      // Admin can optionally update stored state periodically
      if (isAdmin && socket && !isSyncingRef.current) {
        socket.emit('video-state-update', {
          unique_id,
          currentTime: video.currentTime
        });
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [unique_id, isAdmin, socket]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        // Admin can optionally broadcast, but students have independent control
        if (isAdmin && socket) {
          socket.emit('video-state-update', {
            unique_id,
            isPlaying: false,
            currentTime: videoRef.current.currentTime
          });
        }
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        // Admin can optionally broadcast, but students have independent control
        if (isAdmin && socket) {
          socket.emit('video-state-update', {
            unique_id,
            isPlaying: true,
            currentTime: videoRef.current.currentTime
          });
        }
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      // Students have independent volume control - no sync needed
      // Admin can optionally update stored state
      if (isAdmin && socket) {
        socket.emit('video-state-update', {
          unique_id,
          volume: newVolume
        });
      }
    }
  };

  const handleTimeChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Students have independent seek control - no sync needed
      // Admin can optionally update stored state
      if (isAdmin && socket) {
        socket.emit('video-state-update', {
          unique_id,
          currentTime: newTime
        });
      }
    }
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      if (!isAdmin) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        // Upload video to server
        const formData = new FormData();
        formData.append('video', file);
        
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            
            if (data.success && videoRef.current) {
              const videoUrl = data.videoUrl;
              videoRef.current.src = videoUrl;
              setVideoSource(videoUrl);
              setHasVideoSource(true);
              
              if (socket) {
                // Emit video source change with current state
                socket.emit('video-source-change', {
                  unique_id,
                  src: videoUrl,
                  currentTime: videoRef.current.currentTime || 0,
                  volume: videoRef.current.volume || 1,
                  isPlaying: !videoRef.current.paused
                });
                
                // Also update the stored state
                socket.emit('video-state-update', {
                  unique_id,
                  src: videoUrl,
                  currentTime: videoRef.current.currentTime || 0,
                  volume: videoRef.current.volume || 1,
                  isPlaying: !videoRef.current.paused
                });
              }
            }
            setIsUploading(false);
            setUploadProgress(0);
          } else {
            throw new Error('Upload failed');
          }
        });
        
        xhr.addEventListener('error', () => {
          console.error('Error uploading video');
          alert('Failed to upload video. Please try again.');
          setIsUploading(false);
          setUploadProgress(0);
        });
        
        xhr.open('POST', API_ENDPOINTS.UPLOAD_VIDEO(unique_id));
        xhr.send(formData);
        
      } catch (error) {
        console.error('Error uploading video:', error);
        alert('Failed to upload video. Please try again.');
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-wrapper">
      <video
        ref={videoRef}
        className="video-player"
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
      >
        Your browser does not support the video tag.
      </video>
      
      {!hasVideoSource && !isAdmin && (
        <div className="video-placeholder">
          <p>Waiting for admin to load a video...</p>
        </div>
      )}

      {isUploading && (
        <div className="upload-loader">
          <div className="loader-spinner"></div>
          <p className="upload-text">Uploading video...</p>
          <div className="upload-progress-bar">
            <div 
              className="upload-progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="upload-percentage">{Math.round(uploadProgress)}%</p>
        </div>
      )}

      <div className="video-controls">
        <div className="controls-row">
          <button className="control-btn" onClick={handlePlayPause}>
            {isPlaying ? '⏸' : '▶'}
          </button>

          <div className="time-controls">
            <span className="time-display">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleTimeChange}
              className="time-slider"
            />
            <span className="time-display">{formatTime(duration)}</span>
          </div>

          <div className="volume-controls">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>

          <div className="playback-rate-controls">
            <label>Speed:</label>
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="playback-rate-select"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>

          <button className="control-btn" onClick={handleFullscreen}>
            {isFullscreen ? '⤓' : '⛶'}
          </button>
        </div>

        {isAdmin && (
          <div className="file-upload-controls">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? '⏳ Uploading...' : '📁 Upload Video'}
            </button>
            {videoSource && (
              <span className="video-source-info">Video loaded</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;

