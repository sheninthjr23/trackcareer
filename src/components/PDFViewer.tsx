import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string | null;
  fileName: string;
  onDownload: () => void;
  className?: string;
}

export function PDFViewer({ pdfUrl, fileName, onDownload, className = "" }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [currentMethod, setCurrentMethod] = useState<'pdfjs' | 'direct'>('pdfjs');
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (pdfUrl) {
      resetLoadingState();
      startLoadingTimeout();
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [pdfUrl]);

  const resetLoadingState = () => {
    setIsLoading(true);
    setShowFallback(false);
    setCurrentMethod('pdfjs');
    setLoadAttempts(0);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
  };

  const startLoadingTimeout = () => {
    loadTimeoutRef.current = setTimeout(() => {
      console.log('PDF loading timeout - switching to fallback');
      setIsLoading(false);
      if (currentMethod === 'pdfjs') {
        setCurrentMethod('direct');
        setShowFallback(true);
      }
    }, 4000);
  };

  const handleIframeLoad = () => {
    console.log(`${currentMethod} PDF loaded successfully`);
    setIsLoading(false);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
  };

  const handleIframeError = () => {
    console.log(`${currentMethod} PDF failed to load`);
    if (currentMethod === 'pdfjs') {
      console.log('Switching to direct PDF method');
      setCurrentMethod('direct');
      setShowFallback(true);
    } else {
      setIsLoading(false);
    }
  };

  const openWithPdfViewer = () => {
    if (pdfUrl) {
      window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`, '_blank');
    }
  };

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const retryLoad = () => {
    setLoadAttempts(prev => prev + 1);
    resetLoadingState();
    startLoadingTimeout();
  };

  if (!pdfUrl) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No PDF to display</p>
        </div>
      </div>
    );
  }

  const pdfViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
  const directPdfUrl = `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit&view=FitH`;

  return (
    <div className={`relative ${className}`}>
      {/* Action Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          onClick={openWithPdfViewer}
          className="button-elegant flex-1 sm:flex-none"
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF Viewer
        </Button>
        <Button
          onClick={openInNewTab}
          variant="outline"
          className="button-elegant-outline flex-1 sm:flex-none"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          New Tab
        </Button>
        <Button
          onClick={onDownload}
          variant="outline"
          className="button-elegant-outline flex-1 sm:flex-none"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          onClick={retryLoad}
          variant="outline"
          className="button-elegant-outline flex-1 sm:flex-none"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>

      {/* PDF Container */}
      <div className="relative bg-gray-900 rounded-lg border border-white/20 overflow-hidden" style={{ height: '700px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-white text-sm">Loading PDF preview...</p>
              <p className="text-gray-400 text-xs mt-1">
                Method: {currentMethod === 'pdfjs' ? 'PDF.js Viewer' : 'Direct PDF'}
                {loadAttempts > 0 && ` (Attempt ${loadAttempts + 1})`}
              </p>
            </div>
          </div>
        )}

        {/* PDF.js viewer iframe - Primary method */}
        {currentMethod === 'pdfjs' && (
          <iframe
            key={`pdf-viewer-${loadAttempts}`}
            ref={iframeRef}
            src={pdfViewerUrl}
            className="w-full h-full border-0"
            title={`${fileName} - PDF Viewer`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-popups"
            style={{ display: showFallback ? 'none' : 'block' }}
          />
        )}

        {/* Direct PDF iframe - Fallback method */}
        {(currentMethod === 'direct' || showFallback) && (
          <iframe
            key={`pdf-direct-${loadAttempts}`}
            src={directPdfUrl}
            className="w-full h-full border-0"
            title={`${fileName} - Direct PDF`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin"
            style={{ display: currentMethod === 'direct' ? 'block' : 'none' }}
          />
        )}

        {/* Final fallback when both methods fail */}
        {!isLoading && showFallback && currentMethod === 'direct' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm z-10">
            <div className="text-center p-8 max-w-md">
              <FileText className="h-20 w-20 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">PDF Preview Unavailable</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Your browser's security settings are preventing inline PDF viewing. 
                This is common with Chrome and other browsers for security reasons.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={openWithPdfViewer} className="button-elegant w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Open in PDF Viewer
                </Button>
                <div className="flex gap-2">
                  <Button onClick={retryLoad} variant="outline" className="button-elegant-outline flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={onDownload} variant="outline" className="button-elegant-outline flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-white mb-2">💡 Tips for better PDF viewing:</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Use the "PDF Viewer" button for the most reliable experience</li>
          <li>• If blocked, try allowing popups for this site in your browser</li>
          <li>• Download the PDF if inline viewing doesn't work</li>
          <li>• Some browsers work better in incognito/private mode</li>
        </ul>
      </div>
    </div>
  );
}
