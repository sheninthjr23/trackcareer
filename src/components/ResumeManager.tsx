
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, FolderOpen, Plus, Eye, Share2, Edit, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ResumeViewer } from './ResumeViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ResumeFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

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

export function ResumeManager() {
  const [folders, setFolders] = useState<ResumeFolder[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResumeFolder | null>(null);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editResumeName, setEditResumeName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchResumes();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_folders')
        .select('*')
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch folders.",
        variant: "destructive",
      });
    }
  };

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('upload_timestamp', { ascending: false });

      if (error) throw error;
      console.log('Fetched resumes:', data);
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resumes.",
        variant: "destructive",
      });
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('resume_folders')
        .insert({
          name: newFolderName.trim(),
          user_id: user.id,
          parent_folder_id: selectedFolder,
        });

      if (error) throw error;

      setNewFolderName('');
      setIsFolderDialogOpen(false);
      fetchFolders();
      toast({
        title: "Success",
        description: "Folder created successfully.",
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

  const updateFolder = async () => {
    if (!editFolderName.trim() || !editingFolder) return;

    try {
      const { error } = await supabase
        .from('resume_folders')
        .update({ name: editFolderName.trim() })
        .eq('id', editingFolder.id);

      if (error) throw error;

      setEditingFolder(null);
      setEditFolderName('');
      fetchFolders();
      toast({
        title: "Success",
        description: "Folder updated successfully.",
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder.",
        variant: "destructive",
      });
    }
  };

  const deleteFolder = async (folder: ResumeFolder) => {
    try {
      // Check if folder has resumes
      const folderResumes = resumes.filter(r => r.folder_id === folder.id);
      if (folderResumes.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "Please move or delete all resumes in this folder first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('resume_folders')
        .delete()
        .eq('id', folder.id);

      if (error) throw error;

      if (selectedFolder === folder.id) {
        setSelectedFolder(null);
      }
      fetchFolders();
      toast({
        title: "Success",
        description: "Folder deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder.",
        variant: "destructive",
      });
    }
  };

  const updateResume = async () => {
    if (!editResumeName.trim() || !editingResume) return;

    try {
      const { error } = await supabase
        .from('resumes')
        .update({ custom_name: editResumeName.trim() })
        .eq('id', editingResume.id);

      if (error) throw error;

      setEditingResume(null);
      setEditResumeName('');
      fetchResumes();
      toast({
        title: "Success",
        description: "Resume name updated successfully.",
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

  const deleteResume = async (resume: Resume) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id);

      if (dbError) throw dbError;

      fetchResumes();
      toast({
        title: "Success",
        description: "Resume deleted successfully.",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      console.log('Starting file upload for user:', user.id);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully, creating database record');

      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          custom_name: file.name.replace('.pdf', ''),
          original_filename: file.name,
          file_path: filePath,
          user_id: user.id,
          folder_id: selectedFolder,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Resume record created successfully');
      fetchResumes();
      setIsUploadDialogOpen(false);
      toast({
        title: "Success",
        description: "Resume uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Error",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const generateShareableLink = async (resume: Resume) => {
    try {
      const token = crypto.randomUUID();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7); // 7 days from now

      console.log('Generating shareable link with token:', token);

      const { error } = await supabase
        .from('resumes')
        .update({
          shareable_token: token,
          shareable_expiry: expiry.toISOString(),
        })
        .eq('id', resume.id);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/resume/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      
      console.log('Shareable link generated:', shareUrl);
      
      toast({
        title: "Success",
        description: "Shareable link copied to clipboard!",
      });

      fetchResumes(); // Refresh to show updated data
    } catch (error) {
      console.error('Error generating shareable link:', error);
      toast({
        title: "Error",
        description: "Failed to generate shareable link.",
        variant: "destructive",
      });
    }
  };

  const filteredResumes = selectedFolder
    ? resumes.filter(resume => resume.folder_id === selectedFolder)
    : resumes.filter(resume => !resume.folder_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Resume Management</h1>
          <p className="text-muted-foreground">Upload, organize, and share your resumes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="button-elegant-outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your resumes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName" className="text-white">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="input-elegant"
                  />
                </div>
                <Button onClick={createFolder} disabled={!newFolderName.trim()} className="button-elegant w-full">
                  <Plus className="h-4 w-4 mr-2" />
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
                <DialogTitle className="text-white">Upload Resume</DialogTitle>
                <DialogDescription>
                  Upload a PDF resume to your collection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resume" className="text-white">Select PDF File</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="input-elegant"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <span className="text-white">Uploading...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="folders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-white/20">
          <TabsTrigger value="folders" className="text-white data-[state=active]:bg-primary">Folders</TabsTrigger>
          <TabsTrigger value="all" className="text-white data-[state=active]:bg-primary">All Resumes</TabsTrigger>
        </TabsList>

        <TabsContent value="folders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card 
                key={folder.id} 
                className={`elegant-card cursor-pointer transition-all hover:scale-105 ${
                  selectedFolder === folder.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="text-white flex items-center flex-1"
                      onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      {folder.name}
                    </CardTitle>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-2 elegant-card">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-white hover:bg-white/10"
                            onClick={() => {
                              setEditingFolder(folder);
                              setEditFolderName(folder.name);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteFolder(folder)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {resumes.filter(r => r.folder_id === folder.id).length} resumes
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedFolder && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Resumes in {folders.find(f => f.id === selectedFolder)?.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResumes.map((resume) => (
                  <Card key={resume.id} className="elegant-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center text-sm flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          {resume.custom_name}
                        </CardTitle>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2 elegant-card">
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-white hover:bg-white/10"
                                onClick={() => {
                                  setEditingResume(resume);
                                  setEditResumeName(resume.custom_name);
                                }}
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-red-400 hover:bg-red-500/10"
                                onClick={() => deleteResume(resume)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-xs mb-3">
                        {new Date(resume.upload_timestamp).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedResume(resume);
                            setIsViewerOpen(true);
                          }}
                          className="button-elegant-outline flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateShareableLink(resume)}
                          className="button-elegant-outline flex-1"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="elegant-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center text-sm flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      {resume.custom_name}
                    </CardTitle>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-2 elegant-card">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-white hover:bg-white/10"
                            onClick={() => {
                              setEditingResume(resume);
                              setEditResumeName(resume.custom_name);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteResume(resume)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs mb-3">
                    {new Date(resume.upload_timestamp).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedResume(resume);
                        setIsViewerOpen(true);
                      }}
                      className="button-elegant-outline flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateShareableLink(resume)}
                      className="button-elegant-outline flex-1"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Folder</DialogTitle>
            <DialogDescription>
              Update the folder name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFolderName" className="text-white">Folder Name</Label>
              <Input
                id="editFolderName"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="input-elegant"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setEditingFolder(null)} 
                variant="outline" 
                className="button-elegant-outline flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={updateFolder} 
                disabled={!editFolderName.trim()} 
                className="button-elegant flex-1"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resume Dialog */}
      <Dialog open={!!editingResume} onOpenChange={() => setEditingResume(null)}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Resume Name</DialogTitle>
            <DialogDescription>
              Update the display name for your resume.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editResumeName" className="text-white">Resume Name</Label>
              <Input
                id="editResumeName"
                value={editResumeName}
                onChange={(e) => setEditResumeName(e.target.value)}
                placeholder="Enter resume name"
                className="input-elegant"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setEditingResume(null)} 
                variant="outline" 
                className="button-elegant-outline flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={updateResume} 
                disabled={!editResumeName.trim()} 
                className="button-elegant flex-1"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ResumeViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        resume={selectedResume}
      />
    </div>
  );
}
