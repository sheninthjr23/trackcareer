import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && resume) {
      loadPdfUrl();
    } else {
      setPdfUrl(null);
    }
  }, [isOpen, resume]);

  const loadPdfUrl = async () => {
    if (!resume) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resume.file_path, 3600);

      if (error) throw error;
      setPdfUrl(data.signedUrl);
    } catch (error) {
      console.error('Error loading PDF:', error);
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
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border border-white/20"
              title={resume?.custom_name}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Failed to load PDF preview
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
