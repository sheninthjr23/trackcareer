
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Upload, FileText, Download, Share2, Edit2, Trash2, Eye, Folder, Plus, ArrowLeft, Grid3X3, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResumeViewer } from "./ResumeViewer";

interface Resume {
  id: string;
  folderId: string;
  originalFilename: string;
  customName: string;
  uploadTimestamp: string;
  fileContent?: string;
  shareableToken?: string;
}

interface Folder {
  id: string;
  name: string;
  parentFolderId?: string;
  createdAt: string;
}

export function ResumeManager() {
  const [resumes, setResumes] = useLocalStorage<Resume[]>('resumes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('folders', [
    { id: 'root', name: 'All Resumes', createdAt: new Date().toISOString() }
  ]);
  const [selectedFolderId, setSelectedFolderId] = useState('root');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [newCustomName, setNewCustomName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const { toast } = useToast();

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

    const reader = new FileReader();
    reader.onload = () => {
      const newResume: Resume = {
        id: crypto.randomUUID(),
        folderId: selectedFolderId,
        originalFilename: file.name,
        customName: file.name.replace('.pdf', ''),
        uploadTimestamp: new Date().toISOString(),
        fileContent: reader.result as string,
      };

      setResumes(prev => [...prev, newResume]);
      setIsUploadDialogOpen(false);
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume is now available in your collection.",
      });
    };
    reader.readAsDataURL(file);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName,
      parentFolderId: selectedFolderId === 'root' ? undefined : selectedFolderId,
      createdAt: new Date().toISOString(),
    };

    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsFolderDialogOpen(false);
    toast({
      title: "Folder created",
      description: `"${newFolderName}" folder has been created successfully.`,
    });
  };

  const updateResumeName = () => {
    if (!editingResume || !newCustomName.trim()) return;

    setResumes(prev => 
      prev.map(resume => 
        resume.id === editingResume.id 
          ? { ...resume, customName: newCustomName }
          : resume
      )
    );
    setEditingResume(null);
    setNewCustomName('');
    toast({
      title: "Resume renamed",
      description: "Resume name has been updated successfully.",
    });
  };

  const deleteResume = (resumeId: string) => {
    setResumes(prev => prev.filter(resume => resume.id !== resumeId));
    toast({
      title: "Resume deleted",
      description: "Resume has been permanently removed.",
    });
  };

  const downloadResume = (resume: Resume) => {
    if (!resume.fileContent) {
      toast({
        title: "Download failed",
        description: "Resume file is not available for download.",
        variant: "destructive",
      });
      return;
    }
    
    const link = document.createElement('a');
    link.href = resume.fileContent;
    link.download = resume.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your resume is being downloaded.",
    });
  };

  const generateShareLink = (resume: Resume) => {
    const token = crypto.randomUUID();
    setResumes(prev => 
      prev.map(r => r.id === resume.id ? { ...r, shareableToken: token } : r)
    );
    
    const shareUrl = `${window.location.origin}/shared-resume/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share link copied",
      description: "Shareable link has been copied to your clipboard.",
    });
  };

  const currentFolderResumes = resumes.filter(resume => resume.folderId === selectedFolderId);
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const subFolders = folders.filter(f => f.parentFolderId === (selectedFolderId === 'root' ? undefined : selectedFolderId));
  const parentFolder = currentFolder?.parentFolderId ? folders.find(f => f.id === currentFolder.parentFolderId) : null;

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
                  <Label htmlFor="folderName" className="text-white">Folder Name</Label>
                  <Input
                    id="folderName"
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
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white file:text-black hover:file:bg-gray-100"
                  />
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
                    <span className="truncate">{resume.customName}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingResume(resume);
                        setNewCustomName(resume.customName);
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
                  Uploaded: {new Date(resume.uploadTimestamp).toLocaleDateString()}
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
                    View
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
                {resume.shareableToken && (
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
              <Label htmlFor="customName" className="text-white">Custom Name</Label>
              <Input
                id="customName"
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
