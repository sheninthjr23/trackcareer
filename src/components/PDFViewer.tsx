
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true);
      // Check if PDF can be loaded after a short delay
      const timer = setTimeout(() => {
        setShowFallback(true);
        setIsLoading(false);
      }, 3000);

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
      </div>

      {/* Browser Warning */}
      {showFallback && (
        <Alert className="border-amber-500/50 bg-amber-500/10 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            If the PDF doesn't load below, your browser may be blocking it. Use the buttons above to view or download the file.
          </AlertDescription>
        </Alert>
      )}

      {/* PDF Container */}
      <div className="relative bg-gray-900 rounded-lg border border-white/20 overflow-hidden" style={{ height: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-white text-sm">Loading PDF...</p>
            </div>
          </div>
        )}

        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
          className="w-full h-full"
          title={fileName}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setShowFallback(true);
          }}
        />

        {/* Fallback overlay when PDF doesn't load */}
        {showFallback && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm">
            <div className="text-center p-8 max-w-md">
              <FileText className="h-20 w-20 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">PDF Preview Unavailable</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Your browser is blocking the PDF preview or the file format isn't supported. 
                Use the buttons above to view or download the file.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={openWithPdfViewer} className="button-elegant">
                  <FileText className="h-4 w-4 mr-2" />
                  Open PDF Viewer
                </Button>
                <Button onClick={onDownload} variant="outline" className="button-elegant-outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
