
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Download, Share2, Edit2, Trash2, Eye, Folder, Plus, ArrowLeft, Grid3X3, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResumeViewer } from "./ResumeViewer";

interface Resume {
  id: string;
  folder_id?: string;
  original_filename: string;
  custom_name: string;
  upload_timestamp: string;
  file_path: string;
  shareable_token?: string;
  shareable_expiry?: string;
  user_id: string;
}

interface Folder {
  id: string;
  name: string;
  parent_folder_id?: string;
  created_at: string;
  user_id: string;
}

export function ResumeManager() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [newCustomName, setNewCustomName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [resumesResult, foldersResult] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user!.id),
        supabase.from('resume_folders').select('*').eq('user_id', user!.id)
      ]);

      if (resumesResult.error) throw resumesResult.error;
      if (foldersResult.error) throw foldersResult.error;

      setResumes(resumesResult.data || []);
      setFolders(foldersResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resumes and folders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileId = crypto.randomUUID();
      const filePath = `resumes/${user!.id}/${fileId}.pdf`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert metadata
      const { error: insertError } = await supabase
        .from('resumes')
        .insert({
          folder_id: selectedFolderId === 'root' ? null : selectedFolderId,
          original_filename: file.name,
          custom_name: file.name.replace('.pdf', ''),
          file_path: filePath,
          user_id: user!.id,
        });

      if (insertError) throw insertError;

      setIsUploadDialogOpen(false);
      fetchData();
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume is now available in your collection.",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('resume_folders')
        .insert({
          name: newFolderName,
          parent_folder_id: selectedFolderId === 'root' ? null : selectedFolderId,
          user_id: user!.id,
        });

      if (error) throw error;

      setNewFolderName('');
      setIsFolderDialogOpen(false);
      fetchData();
      toast({
        title: "Folder created",
        description: `"${newFolderName}" folder has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder.",
        variant: "destructive",
      });
    }
  };

  const updateResumeName = async () => {
    if (!editingResume || !newCustomName.trim()) return;

    try {
      const { error } = await supabase
        .from('resumes')
        .update({ custom_name: newCustomName })
        .eq('id', editingResume.id);

      if (error) throw error;

      setEditingResume(null);
      setNewCustomName('');
      fetchData();
      toast({
        title: "Resume renamed",
        description: "Resume name has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating resume:', error);
      toast({
        title: "Error",
        description: "Failed to update resume name.",
        variant: "destructive",
      });
    }
  };

  const deleteResume = async (resumeId: string) => {
    try {
      const resume = resumes.find(r => r.id === resumeId);
      if (!resume) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);

      if (storageError) console.warn('Error deleting from storage:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (dbError) throw dbError;

      fetchData();
      toast({
        title: "Resume deleted",
        description: "Resume has been permanently removed.",
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Error",
        description: "Failed to delete resume.",
        variant: "destructive",
      });
    }
  };

  const downloadResume = async (resume: Resume) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resume.file_path, 60);

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = resume.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: "Your resume is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Download failed",
        description: "Failed to download resume.",
        variant: "destructive",
      });
    }
  };

  const generateShareLink = async (resume: Resume) => {
    try {
      const token = crypto.randomUUID();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      const { error } = await supabase
        .from('resumes')
        .update({
          shareable_token: token,
          shareable_expiry: expiry.toISOString(),
        })
        .eq('id', resume.id);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/resume/${token}`;
      navigator.clipboard.writeText(shareUrl);
      fetchData();
      toast({
        title: "Share link copied",
        description: "Shareable link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive",
      });
    }
  };

  const currentFolderResumes = resumes.filter(resume => 
    selectedFolderId === 'root' 
      ? !resume.folder_id 
      : resume.folder_id === selectedFolderId
  );
  
  const currentFolder = selectedFolderId === 'root' 
    ? { id: 'root', name: 'All Resumes' }
    : folders.find(f => f.id === selectedFolderId);
  
  const subFolders = folders.filter(f => 
    selectedFolderId === 'root' 
      ? !f.parent_folder_id
      : f.parent_folder_id === selectedFolderId
  );
  
  const parentFolder = currentFolder && 'parent_folder_id' in currentFolder && currentFolder.parent_folder_id
    ? folders.find(f => f.id === currentFolder.parent_folder_id)
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Resume Collection</h2>
            <p className="text-muted-foreground">Loading your resumes...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Resume Collection</h2>
          <p className="text-muted-foreground text-lg">Organize, preview, and share your professional documents</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="button-elegant-outline">
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Organize your resumes by creating a new folder.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name" className="text-white">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="elegant-input mt-2"
                  />
                </div>
                <Button onClick={createFolder} className="w-full button-elegant">
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="button-elegant">
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card">
              <DialogHeader>
                <DialogTitle>Upload Resume</DialogTitle>
                <DialogDescription>
                  Add a PDF resume to your collection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pdf-file" className="text-white">Select PDF File</Label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors mt-2">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Input
                      id="pdf-file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white file:text-black hover:file:bg-gray-100"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Current location: <span className="text-white">{currentFolder?.name}</span>
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navigation */}
      <Card className="elegant-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedFolderId !== 'root' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFolderId(parentFolder?.id || 'root')}
                  className="button-elegant-outline h-8"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-white" />
                <CardTitle className="text-white">{currentFolder?.name}</CardTitle>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {currentFolderResumes.length} resume{currentFolderResumes.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        {subFolders.length > 0 && (
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subFolders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="cursor-pointer card-hover elegant-card"
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-white" />
                      <span className="font-medium text-white truncate">{folder.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Resume Grid/List */}
      {currentFolderResumes.length === 0 ? (
        <Card className="elegant-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No resumes yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Upload your first resume to get started with your professional collection.
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)} className="button-elegant">
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {currentFolderResumes.map((resume) => (
            <Card key={resume.id} className={`card-hover elegant-card ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
              <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="truncate">{resume.custom_name}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingResume(resume);
                        setNewCustomName(resume.custom_name);
                      }}
                      className="h-8 w-8 p-0 hover:bg-white/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteResume(resume.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Uploaded: {new Date(resume.upload_timestamp).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className={viewMode === 'list' ? 'flex items-center gap-2' : ''}>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="button-elegant-outline flex-1"
                    onClick={() => setViewingResume(resume)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="button-elegant-outline flex-1"
                    onClick={() => downloadResume(resume)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateShareLink(resume)}
                    className="button-elegant-outline"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                {resume.shareable_token && (
                  <Badge variant="secondary" className="mt-3 bg-green-500/10 text-green-400 border-green-500/30">
                    Shareable link generated
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Resume Dialog */}
      <Dialog open={!!editingResume} onOpenChange={() => setEditingResume(null)}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>
              Update the display name for this resume.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-name" className="text-white">New Name</Label>
              <Input
                id="new-name"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="Enter custom name"
                className="elegant-input mt-2"
              />
            </div>
            <Button onClick={updateResumeName} className="w-full button-elegant">
              Update Name
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Viewer */}
      <ResumeViewer
        isOpen={!!viewingResume}
        onClose={() => setViewingResume(null)}
        resume={viewingResume}
      />
    </div>
  );
}
