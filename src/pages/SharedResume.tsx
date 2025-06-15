
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFViewer } from "@/components/PDFViewer";

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
        .createSignedUrl(data.file_path, 3600);

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        setError('Failed to load resume file.');
        return;
      }

      console.log('PDF URL created successfully');
      setPdfUrl(signedUrlData.signedUrl);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading shared resume...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="elegant-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-white">{resume?.custom_name}</h1>
                <p className="text-muted-foreground">Shared Resume</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        <Card className="elegant-card">
          <CardContent className="p-6">
            <PDFViewer
              pdfUrl={pdfUrl}
              fileName={resume?.custom_name || 'Resume'}
              onDownload={downloadResume}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
