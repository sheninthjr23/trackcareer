
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Upload, FileText, Download, Share2, Edit2, Trash2, Eye, Folder, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Resume {
  id: string;
  folderId: string;
  originalFilename: string;
  customName: string;
  uploadTimestamp: string;
  fileContent?: string; // Base64 content for demo
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
    { id: 'root', name: 'Root', createdAt: new Date().toISOString() }
  ]);
  const [selectedFolderId, setSelectedFolderId] = useState('root');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [newCustomName, setNewCustomName] = useState('');
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
        title: "Resume uploaded",
        description: "Your resume has been successfully uploaded.",
      });
    };
    reader.readAsDataURL(file);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName,
      parentFolderId: selectedFolderId,
      createdAt: new Date().toISOString(),
    };

    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsFolderDialogOpen(false);
    toast({
      title: "Folder created",
      description: `Folder "${newFolderName}" has been created.`,
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
      description: "Resume name has been updated.",
    });
  };

  const deleteResume = (resumeId: string) => {
    setResumes(prev => prev.filter(resume => resume.id !== resumeId));
    toast({
      title: "Resume deleted",
      description: "Resume has been removed.",
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
      description: "Shareable link has been copied to clipboard.",
    });
  };

  const currentFolderResumes = resumes.filter(resume => resume.folderId === selectedFolderId);
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const subFolders = folders.filter(f => f.parentFolderId === selectedFolderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resume Management</h2>
          <p className="text-muted-foreground">Upload, organize, and share your resumes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your resumes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <Button onClick={createFolder} className="w-full">
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Resume</DialogTitle>
                <DialogDescription>
                  Upload a PDF resume to the current folder.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Current folder: {currentFolder?.name}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Folder Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Current Location: {currentFolder?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {subFolders.map((folder) => (
              <Card 
                key={folder.id} 
                className="cursor-pointer card-hover"
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    <span className="font-medium">{folder.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resume Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentFolderResumes.map((resume) => (
          <Card key={resume.id} className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="truncate">{resume.customName}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingResume(resume);
                      setNewCustomName(resume.customName);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteResume(resume.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Uploaded: {new Date(resume.uploadTimestamp).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateShareLink(resume)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              {resume.shareableToken && (
                <Badge variant="secondary" className="mt-2">
                  Shareable link generated
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Resume Dialog */}
      <Dialog open={!!editingResume} onOpenChange={() => setEditingResume(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>
              Update the custom name for this resume.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customName">Custom Name</Label>
              <Input
                id="customName"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="Enter custom name"
              />
            </div>
            <Button onClick={updateResumeName} className="w-full">
              Update Name
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
