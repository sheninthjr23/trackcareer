
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      const { data, error } = await supabase
        .from('resumes')
        .select('id, custom_name, original_filename, file_path, shareable_expiry')
        .eq('shareable_token', token)
        .single();

      if (error || !data) {
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
              <Button onClick={downloadResume} className="button-elegant">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        <Card className="elegant-card">
          <CardContent className="p-0">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-[800px] rounded-lg"
                title={resume?.custom_name}
              />
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">Failed to load PDF preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
