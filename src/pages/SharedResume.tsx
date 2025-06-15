
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, AlertCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SharedResumeData {
  id: string;
  custom_name: string;
  original_filename: string;
  file_path: string;
  shareable_expiry: string;
}

export default function SharedResume() {
  const { token } = useParams<{ token: string }>();
  const [resume, setResume] = useState<SharedResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchSharedResume();
    }
  }, [token]);

  const fetchSharedResume = async () => {
    try {
      console.log('Fetching shared resume with token:', token);
      
      const { data, error } = await supabase
        .from('resumes')
        .select('id, custom_name, original_filename, file_path, shareable_expiry')
        .eq('shareable_token', token)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        setError('Resume not found or link is invalid.');
        return;
      }

      if (!data) {
        setError('Resume not found or link is invalid.');
        return;
      }

      // Check if link is expired
      const expiryDate = new Date(data.shareable_expiry);
      const now = new Date();
      
      if (now > expiryDate) {
        setError('This share link has expired.');
        return;
      }

      console.log('Resume data found:', data);
      setResume(data);
      
      // Get signed URL for the PDF
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(data.file_path, 3600); // Valid for 1 hour

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        setError('Failed to load resume file.');
        return;
      }

      console.log('PDF URL created successfully');
      setPdfUrl(signedUrlData.signedUrl);
      
      // Check if we should show browser warning after a short delay
      setTimeout(() => {
        setShowBrowserWarning(true);
      }, 2000);
    } catch (error) {
      console.error('Error fetching shared resume:', error);
      setError('An error occurred while loading the resume.');
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
      window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
        <Card className="w-full max-w-md elegant-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="elegant-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-white">{resume?.custom_name}</h1>
                  <p className="text-sm text-muted-foreground">Shared Resume</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={openWithPdfViewer} className="button-elegant" disabled={!pdfUrl}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Viewer
                </Button>
                <Button onClick={openInNewTab} variant="outline" className="button-elegant-outline" disabled={!pdfUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  New Tab
                </Button>
                <Button onClick={downloadResume} variant="outline" className="button-elegant-outline" disabled={!pdfUrl}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Warning */}
        {showBrowserWarning && pdfUrl && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              If the PDF doesn't load below, your browser may be blocking it. Use the "PDF Viewer" button above or download the file directly.
            </AlertDescription>
          </Alert>
        )}

        {/* PDF Viewer */}
        <Card className="elegant-card">
          <CardContent className="p-0 relative">
            {pdfUrl ? (
              <div className="relative">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-[800px] rounded-lg"
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
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <p className="text-muted-foreground">Loading PDF preview...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
