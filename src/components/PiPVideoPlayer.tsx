
import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePiPVideo } from '@/contexts/PiPVideoContext';

export function PiPVideoPlayer() {
  const { pipState, closePiP, updatePosition, updateSize } = usePiPVideo();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bufferingCount, setBufferingCount] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const extractGoogleDriveVideoId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const getOptimizedEmbedUrl = (driveUrl: string) => {
    const videoId = extractGoogleDriveVideoId(driveUrl);
    if (!videoId) return null;
    
    // Optimized URL with better streaming parameters
    const params = new URLSearchParams({
      usp: 'sharing',
      autoplay: '0', // Start paused to allow preloading
      quality: 'hd720', // Balanced quality for better streaming
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      controls: '1',
      enablejsapi: '1',
      origin: window.location.origin,
      playsinline: '1',
      // Additional streaming optimization parameters
      start: '0',
      fs: '1',
      cc_load_policy: '0',
      iv_load_policy: '3',
      loop: '0'
    });
    
    return `https://drive.google.com/file/d/${videoId}/preview?${params.toString()}`;
  };

  // Preload iframe content
  useEffect(() => {
    if (pipState.videoUrl && pipState.isOpen) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = getOptimizedEmbedUrl(pipState.videoUrl) || '';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [pipState.videoUrl, pipState.isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - pipState.size.width;
        const maxY = window.innerHeight - pipState.size.height;
        
        updatePosition(
          Math.max(0, Math.min(newX, maxX)),
          Math.max(0, Math.min(newY, maxY))
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, pipState.size, updatePosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pipState.position.x,
      y: e.clientY - pipState.position.y
    });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleIframeLoad = () => {
    console.log('PiP video iframe loaded successfully');
    setIsLoading(false);
    setBufferingCount(0);
  };

  const handleIframeError = () => {
    console.error('PiP video iframe failed to load');
    setIsLoading(false);
    setBufferingCount(prev => prev + 1);
  };

  // Monitor iframe for buffering issues
  useEffect(() => {
    if (!isLoading && iframeRef.current) {
      const iframe = iframeRef.current;
      let bufferingTimeout: NodeJS.Timeout;
      
      const checkBuffering = () => {
        try {
          // Reset buffering timeout
          clearTimeout(bufferingTimeout);
          bufferingTimeout = setTimeout(() => {
            console.log('Potential buffering detected in PiP video');
            setBufferingCount(prev => prev + 1);
          }, 3000);
        } catch (error) {
          console.log('Cannot access iframe content due to CORS');
        }
      };

      // Listen for iframe interactions
      iframe.addEventListener('load', checkBuffering);
      
      return () => {
        iframe.removeEventListener('load', checkBuffering);
        clearTimeout(bufferingTimeout);
      };
    }
  }, [isLoading]);

  if (!pipState.isOpen || !pipState.videoUrl) {
    return null;
  }

  const embedUrl = getOptimizedEmbedUrl(pipState.videoUrl);

  return (
    <div
      ref={playerRef}
      className="fixed bg-black/95 backdrop-blur border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden"
      style={{
        left: pipState.position.x,
        top: pipState.position.y,
        width: isMinimized ? 300 : pipState.size.width,
        height: isMinimized ? 40 : pipState.size.height + 40,
        transition: isMinimized ? 'all 0.3s ease' : 'none'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between bg-gray-900/90 px-3 py-2 cursor-move select-none border-b border-white/10"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Move className="h-4 w-4 text-gray-400" />
          <span className="text-white text-sm font-medium truncate">
            {pipState.videoTitle}
          </span>
          {bufferingCount > 2 && (
            <span className="text-yellow-400 text-xs ml-2">Buffering issues detected</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMinimize}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={closePiP}
            className="h-6 w-6 p-0 text-white hover:bg-red-500"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Video Content */}
      {!isMinimized && (
        <div className="relative">
          {isLoading && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10"
              style={{ height: pipState.size.height }}
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-white text-sm">Optimizing video stream...</p>
              </div>
            </div>
          )}
          
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="w-full h-full border-0"
              title={pipState.videoTitle}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
              style={{ height: pipState.size.height }}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              loading="eager"
              importance="high"
            />
          ) : (
            <div 
              className="flex items-center justify-center text-white bg-gray-800"
              style={{ height: pipState.size.height }}
            >
              <div className="text-center">
                <p className="text-red-400 mb-2">❌ Invalid video link</p>
                <p className="text-sm text-gray-400">Please check the Google Drive link</p>
              </div>
            </div>
          )}
          
          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/40 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = pipState.size.width;
              const startHeight = pipState.size.height;

              const handleResize = (e: MouseEvent) => {
                const newWidth = Math.max(300, startWidth + (e.clientX - startX));
                const newHeight = Math.max(200, startHeight + (e.clientY - startY));
                updateSize(newWidth, newHeight);
              };

              const handleResizeEnd = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleResizeEnd);
              };

              document.addEventListener('mousemove', handleResize);
              document.addEventListener('mouseup', handleResizeEnd);
            }}
          >
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-white/60 rounded-tl"></div>
          </div>
        </div>
      )}
    </div>
  );
}
