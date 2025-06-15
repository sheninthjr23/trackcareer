
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFViewerProps {
  pdfUrl: string | null;
  fileName: string;
  onDownload: () => void;
  className?: string;
}

export function PDFViewer({ pdfUrl, fileName, onDownload, className = "" }: PDFViewerProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);

  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true);
      setShowFallback(false);
      setLoadAttempts(0);
      
      // Set a timeout to show fallback if PDF doesn't load
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowFallback(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [pdfUrl]);

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
    setIsLoading(true);
    setShowFallback(false);
    
    // Force iframe reload by changing the key
    const iframe = document.querySelector('iframe[data-pdf-viewer]') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    
    setTimeout(() => {
      setIsLoading(false);
      setShowFallback(true);
    }, 3000);
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
        {showFallback && (
          <Button
            onClick={retryLoad}
            variant="outline"
            className="button-elegant-outline flex-1 sm:flex-none"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>

      {/* Browser Warning */}
      <Alert className="border-amber-500/50 bg-amber-500/10 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-200">
          <strong>Viewing PDFs inline:</strong> Some browsers may block PDF display for security reasons. 
          If the PDF doesn't appear below, use the "PDF Viewer" button above for the best experience.
        </AlertDescription>
      </Alert>

      {/* PDF Container */}
      <div className="relative bg-gray-900 rounded-lg border border-white/20 overflow-hidden" style={{ height: '700px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-white text-sm">Loading PDF preview...</p>
              {loadAttempts > 0 && (
                <p className="text-gray-400 text-xs mt-1">Attempt {loadAttempts + 1}</p>
              )}
            </div>
          </div>
        )}

        {/* Primary PDF.js viewer iframe */}
        <iframe
          key={`pdf-viewer-${loadAttempts}`}
          src={pdfViewerUrl}
          className="w-full h-full border-0"
          title={`${fileName} - PDF Viewer`}
          data-pdf-viewer="true"
          onLoad={() => {
            console.log('PDF.js viewer loaded successfully');
            setIsLoading(false);
          }}
          onError={() => {
            console.log('PDF.js viewer failed to load, trying direct PDF');
            setIsLoading(false);
            setShowFallback(true);
          }}
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ display: showFallback ? 'none' : 'block' }}
        />

        {/* Fallback direct PDF iframe */}
        {showFallback && (
          <iframe
            key={`pdf-direct-${loadAttempts}`}
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit&view=FitH`}
            className="w-full h-full border-0"
            title={`${fileName} - Direct PDF`}
            onLoad={() => {
              console.log('Direct PDF loaded successfully');
              setIsLoading(false);
            }}
            onError={() => {
              console.log('Direct PDF also failed to load');
              setIsLoading(false);
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {/* Final fallback when both iframes fail */}
        {showFallback && !isLoading && (
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
