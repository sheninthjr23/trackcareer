
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ResumeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  resume: {
    id: string;
    customName: string;
    fileContent?: string;
    originalFilename: string;
  } | null;
}

export function ResumeViewer({ isOpen, onClose, resume }: ResumeViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!resume) return null;

  const handleDownload = () => {
    if (!resume.fileContent) return;
    
    const link = document.createElement('a');
    link.href = resume.fileContent;
    link.download = resume.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] elegant-card">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10">
          <DialogTitle className="text-xl font-semibold text-white">
            {resume.customName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="button-elegant-outline h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="button-elegant-outline h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="button-elegant-outline h-8 w-8 p-0"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleDownload}
              className="button-elegant"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="button-elegant-outline h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {resume.fileContent ? (
            <div className="flex justify-center p-4">
              <div 
                className="bg-white shadow-2xl"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s ease'
                }}
              >
                <iframe
                  src={resume.fileContent}
                  className="w-[595px] h-[842px] border-none"
                  title={resume.customName}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No preview available</p>
                <p className="text-sm">PDF content could not be loaded</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
