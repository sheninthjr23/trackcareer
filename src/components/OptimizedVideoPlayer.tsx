
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface OptimizedVideoPlayerProps {
  videoUrl: string;
  title: string;
  onError?: () => void;
  className?: string;
}

export function OptimizedVideoPlayer({ 
  videoUrl, 
  title, 
  onError,
  className = ""
}: OptimizedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Extract Google Drive video ID and create streaming URL
  const getStreamingUrl = (driveUrl: string) => {
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    
    const videoId = match[1];
    // Use direct streaming URL for better quality
    return `https://drive.google.com/uc?export=download&id=${videoId}`;
  };

  const streamingUrl = getStreamingUrl(videoUrl);

  useEffect(() => {
    if (!videoRef.current || !streamingUrl) return;

    const video = videoRef.current;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setError('Failed to load video. The video might be private or the link is invalid.');
      setIsLoading(false);
      onError?.();
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [streamingUrl, onError]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    if (!videoRef.current) return;
    
    const volumeValue = newVolume[0] / 100;
    videoRef.current.volume = volumeValue;
    setVolume(newVolume);
    
    if (volumeValue === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleSeek = (newTime: number[]) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = newTime[0];
    setCurrentTime(newTime[0]);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleRetry = () => {
    if (!videoRef.current) return;
    
    setError(null);
    setIsLoading(true);
    videoRef.current.load();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!streamingUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center">
          <p className="text-red-400 mb-2">❌ Invalid video link</p>
          <p className="text-sm text-gray-400">Please check the Google Drive link</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ {error}</p>
          <Button onClick={handleRetry} variant="outline" className="text-white border-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={streamingUrl}
        className="w-full h-full object-contain"
        preload="auto"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Center play button */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white/50"
            >
              <Play className="h-8 w-8 text-white ml-1" />
            </Button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="w-20">
                <Slider
                  value={volume}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{title}</span>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
