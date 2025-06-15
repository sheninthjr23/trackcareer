
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PDFViewer } from "./PDFViewer";

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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && resume) {
      loadPdfUrl();
    } else {
      setPdfUrl(null);
      setError(null);
    }
  }, [isOpen, resume]);

  const loadPdfUrl = async () => {
    if (!resume) return;
    
    setLoading(true);
    setError(null);
    
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] elegant-card p-0">
        <DialogHeader className="p-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-white text-xl">
            {resume?.custom_name || 'Resume'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-white">Loading PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={loadPdfUrl}
                className="button-elegant px-6 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : (
            <PDFViewer
              pdfUrl={pdfUrl}
              fileName={resume?.custom_name || 'Resume'}
              onDownload={downloadResume}
              className="h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
