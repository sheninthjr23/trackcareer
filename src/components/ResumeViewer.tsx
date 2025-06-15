
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Resume {
  id: string;
  custom_name: string;
  original_filename: string;
  file_path: string;
  upload_timestamp: string;
  user_id: string;
  folder_id?: string;
  shareable_token?: string;
  shareable_expiry?: string;
  created_at: string;
  updated_at: string;
}

interface ResumeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume | null;
}

export function ResumeViewer({ isOpen, onClose, resume }: ResumeViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && resume) {
      loadPdfUrl();
    } else {
      setPdfUrl(null);
      setError(null);
      setShowBrowserWarning(false);
    }
  }, [isOpen, resume]);

  const loadPdfUrl = async () => {
    if (!resume) return;
    
    setLoading(true);
    setError(null);
    setShowBrowserWarning(false);
    
    try {
      console.log('Loading PDF for resume:', resume.file_path);
      
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resume.file_path, 3600);

      if (error) {
        console.error('Storage error:', error);
        throw error;
      }
      
      console.log('PDF URL created successfully');
      setPdfUrl(data.signedUrl);
      
      // Check if we should show browser warning after a short delay
      setTimeout(() => {
        setShowBrowserWarning(true);
      }, 2000);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF preview. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load PDF preview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = () => {
    if (pdfUrl && resume) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = resume.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Resume is being downloaded.",
      });
    }
  };

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const openWithPdfViewer = () => {
    if (pdfUrl) {
      // Open with PDF.js viewer or browser's default PDF handler
      window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] elegant-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">{resume?.custom_name}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openWithPdfViewer}
                disabled={!pdfUrl}
                className="button-elegant-outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF Viewer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                disabled={!pdfUrl}
                className="button-elegant-outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadResume}
                disabled={!pdfUrl}
                className="button-elegant-outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {showBrowserWarning && pdfUrl && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                If the PDF doesn't load below, your browser may be blocking it. Try using the "PDF Viewer" button above or download the file directly.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mr-3"></div>
                <p className="text-white">Loading PDF preview...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button 
                  onClick={loadPdfUrl}
                  className="button-elegant"
                >
                  Try Again
                </Button>
              </div>
            ) : pdfUrl ? (
              <div className="relative h-full">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full rounded-lg border border-white/20"
                  title={resume?.custom_name}
                  onError={() => setShowBrowserWarning(true)}
                />
                {showBrowserWarning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <div className="text-center p-8 max-w-md">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">PDF Preview Blocked</h3>
                      <p className="text-muted-foreground mb-4">
                        Your browser is blocking the PDF preview. Use the buttons above to view or download the file.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={openWithPdfViewer} size="sm" className="button-elegant">
                          <FileText className="h-4 w-4 mr-2" />
                          Open PDF Viewer
                        </Button>
                        <Button onClick={downloadResume} size="sm" variant="outline" className="button-elegant-outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No PDF to display
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
