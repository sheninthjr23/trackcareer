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
  const playerRef = useRef<HTMLDivElement>(null);

  const extractGoogleDriveVideoId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (driveUrl: string) => {
    const videoId = extractGoogleDriveVideoId(driveUrl);
    return videoId ? `https://drive.google.com/file/d/${videoId}/preview` : null;
  };

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

  if (!pipState.isOpen || !pipState.videoUrl) {
    return null;
  }

  const embedUrl = getEmbedUrl(pipState.videoUrl);

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
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              title={pipState.videoTitle}
              allowFullScreen
              style={{ height: pipState.size.height }}
            />
          ) : (
            <div 
              className="flex items-center justify-center text-white bg-gray-800"
              style={{ height: pipState.size.height }}
            >
              No valid video link available
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
