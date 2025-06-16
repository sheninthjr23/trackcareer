import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Video, ArrowUp, ArrowDown, Edit, Trash2, Folder, PictureInPicture, Share2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePiPIntegration } from '@/hooks/usePiPIntegration';
import { FolderShareManager } from './FolderShareManager';

interface CourseFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  isShared?: boolean;
  sharedBy?: string;
  permissionLevel?: string;
}

interface CourseElement {
  id: string;
  title: string;
  course_order: number;
  google_drive_link: string | null;
  description: string;
  folder_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface SharedFolder {
  folder_id: string;
  folder_name: string;
  shared_by_email: string | null;
  permission_level: string;
  shared_at: string;
}

export function CourseManager() {
  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [elements, setElements] = useState<CourseElement[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<CourseElement | null>(null);
  const [editingElement, setEditingElement] = useState<CourseElement | null>(null);
  const [editingFolder, setEditingFolder] = useState<CourseFolder | null>(null);
  const [sharingFolder, setSharingFolder] = useState<CourseFolder | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editFolderName, setEditFolderName] = useState('');
  const [newElement, setNewElement] = useState({
    title: '',
    google_drive_link: '',
    description: '',
  });
  const [editElement, setEditElement] = useState({
    title: '',
    google_drive_link: '',
    description: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { openVideoInPiP, isVideoInPiP } = usePiPIntegration();

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchSharedFolders();
      fetchElements();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('course_folders')
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

  const fetchSharedFolders = async () => {
    try {
      const { data, error } = await supabase.rpc('get_shared_folders_for_user');

      if (error) throw error;
      console.log('Shared folders fetched:', data);
      setSharedFolders(data || []);
    } catch (error) {
      console.error('Error fetching shared folders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shared folders.",
        variant: "destructive",
      });
    }
  };

  const fetchElements = async () => {
    try {
      const { data, error } = await supabase
        .from('course_elements')
        .select('*')
        .order('course_order');

      if (error) throw error;
      setElements(data || []);
    } catch (error) {
      console.error('Error fetching course elements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course elements.",
        variant: "destructive",
      });
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('course_folders')
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
        description: "Course folder created successfully.",
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
    if (!editingFolder || !editFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('course_folders')
        .update({ name: editFolderName.trim() })
        .eq('id', editingFolder.id);

      if (error) throw error;

      setIsEditFolderDialogOpen(false);
      setEditingFolder(null);
      setEditFolderName('');
      fetchFolders();
      toast({
        title: "Success",
        description: "Course folder updated successfully.",
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

  const deleteFolder = async (folderId: string) => {
    try {
      // First check if folder has any content
      const [elementsInFolder, subFolders] = await Promise.all([
        supabase.from('course_elements').select('id').eq('folder_id', folderId),
        supabase.from('course_folders').select('id').eq('parent_folder_id', folderId)
      ]);

      const hasContent = 
        (elementsInFolder.data && elementsInFolder.data.length > 0) ||
        (subFolders.data && subFolders.data.length > 0);

      if (hasContent) {
        toast({
          title: "Cannot Delete",
          description: "Folder contains course elements or subfolders. Please remove them first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('course_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      
      fetchFolders();
      toast({
        title: "Success",
        description: "Course folder deleted successfully.",
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

  const createElement = async () => {
    if (!newElement.title.trim() || !selectedFolder || !user) return;

    try {
      const folderElements = elements.filter(e => e.folder_id === selectedFolder);
      const nextOrder = folderElements.length > 0 
        ? Math.max(...folderElements.map(e => e.course_order)) + 1 
        : 1;

      const { error } = await supabase
        .from('course_elements')
        .insert({
          title: newElement.title.trim(),
          google_drive_link: newElement.google_drive_link.trim() || null,
          description: newElement.description.trim(),
          folder_id: selectedFolder,
          user_id: user.id,
          course_order: nextOrder,
        });

      if (error) throw error;

      setNewElement({ title: '', google_drive_link: '', description: '' });
      setIsElementDialogOpen(false);
      fetchElements();
      toast({
        title: "Success",
        description: "Course element created successfully.",
      });
    } catch (error) {
      console.error('Error creating element:', error);
      toast({
        title: "Error",
        description: "Failed to create course element.",
        variant: "destructive",
      });
    }
  };

  const updateElement = async () => {
    if (!editingElement || !editElement.title.trim()) return;

    try {
      const { error } = await supabase
        .from('course_elements')
        .update({
          title: editElement.title.trim(),
          google_drive_link: editElement.google_drive_link.trim() || null,
          description: editElement.description.trim(),
        })
        .eq('id', editingElement.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setEditingElement(null);
      fetchElements();
      toast({
        title: "Success",
        description: "Course element updated successfully.",
      });
    } catch (error) {
      console.error('Error updating element:', error);
      toast({
        title: "Error",
        description: "Failed to update course element.",
        variant: "destructive",
      });
    }
  };

  const deleteElement = async (elementId: string) => {
    try {
      const { error } = await supabase
        .from('course_elements')
        .delete()
        .eq('id', elementId);

      if (error) throw error;

      fetchElements();
      toast({
        title: "Success",
        description: "Course element deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting element:', error);
      toast({
        title: "Error",
        description: "Failed to delete course element.",
        variant: "destructive",
      });
    }
  };

  const updateElementOrder = async (elementId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('course_elements')
        .update({ course_order: newOrder })
        .eq('id', elementId);

      if (error) throw error;
      fetchElements();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive",
      });
    }
  };

  const moveElement = (element: CourseElement, direction: 'up' | 'down') => {
    const folderElements = elements
      .filter(e => e.folder_id === element.folder_id)
      .sort((a, b) => a.course_order - b.course_order);
    
    const currentIndex = folderElements.findIndex(e => e.id === element.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetElement = folderElements[currentIndex - 1];
      updateElementOrder(element.id, targetElement.course_order);
      updateElementOrder(targetElement.id, element.course_order);
    } else if (direction === 'down' && currentIndex < folderElements.length - 1) {
      const targetElement = folderElements[currentIndex + 1];
      updateElementOrder(element.id, targetElement.course_order);
      updateElementOrder(targetElement.id, element.course_order);
    }
  };

  const extractGoogleDriveVideoId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (driveUrl: string) => {
    const videoId = extractGoogleDriveVideoId(driveUrl);
    return videoId ? `https://drive.google.com/file/d/${videoId}/preview` : null;
  };

  const openEditDialog = (element: CourseElement) => {
    setEditingElement(element);
    setEditElement({
      title: element.title,
      google_drive_link: element.google_drive_link || '',
      description: element.description,
    });
    setIsEditDialogOpen(true);
  };

  const openEditFolderDialog = (folder: CourseFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsEditFolderDialogOpen(true);
  };

  const openShareDialog = (folder: CourseFolder) => {
    setSharingFolder(folder);
  };

  // Check if the selected folder is owned by the current user
  const isOwnerOfSelectedFolder = () => {
    if (!selectedFolder || !user) return false;
    const folder = folders.find(f => f.id === selectedFolder);
    return folder?.user_id === user.id;
  };

  // Get permission level for shared folder
  const getSharedFolderPermission = (folderId: string) => {
    const sharedFolder = sharedFolders.find(sf => sf.folder_id === folderId);
    return sharedFolder?.permission_level || 'view';
  };

  // Combine owned folders and shared folders for display
  const getAllFoldersForDisplay = () => {
    const ownedFolders = folders.map(folder => ({
      ...folder,
      isShared: false
    }));

    const sharedFoldersAsDisplayFolders = sharedFolders.map(sf => ({
      id: sf.folder_id,
      name: sf.folder_name,
      parent_folder_id: null, // Shared folders are displayed at root level
      user_id: '', // Not the current user
      created_at: sf.shared_at,
      updated_at: sf.shared_at,
      isShared: true,
      sharedBy: sf.shared_by_email,
      permissionLevel: sf.permission_level
    }));

    return [...ownedFolders, ...sharedFoldersAsDisplayFolders];
  };

  const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
    const allFolders = getAllFoldersForDisplay();
    const childFolders = allFolders.filter(folder => 
      folder.parent_folder_id === parentId
    );
    
    return childFolders.map((folder) => (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <Card 
          className={`elegant-card cursor-pointer transition-all hover:scale-105 mb-2 ${
            selectedFolder === folder.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center justify-between">
              <div className="flex items-center">
                {folder.isShared ? (
                  <Users className="h-4 w-4 mr-2 text-blue-400" />
                ) : level > 0 ? (
                  <Folder className="h-4 w-4 mr-2" />
                ) : (
                  <FolderOpen className="h-4 w-4 mr-2" />
                )}
                {folder.name}
                {folder.isShared && (
                  <span className="ml-2 text-xs text-blue-400">
                    (shared by {folder.sharedBy})
                  </span>
                )}
              </div>
              {!folder.isShared && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openShareDialog(folder)}
                    className="h-6 w-6 p-0 border-gray-400 text-gray-400 hover:bg-blue-500 hover:border-blue-400"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditFolderDialog(folder)}
                    className="h-6 w-6 p-0 border-gray-400 text-gray-400 hover:bg-gray-700 hover:border-gray-300"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFolder(folder.id)}
                    className="h-6 w-6 p-0 border-gray-400 text-gray-400 hover:bg-red-500 hover:border-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {elements.filter(e => e.folder_id === folder.id).length} elements
              {folder.isShared && (
                <span className="ml-2 text-blue-400">
                  ({folder.permissionLevel} access)
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        {!folder.isShared && renderFolderTree(folder.id, level + 1)}
      </div>
    ));
  };

  const filteredElements = selectedFolder
    ? elements
        .filter(element => element.folder_id === selectedFolder)
        .sort((a, b) => a.course_order - b.course_order)
    : [];

  const openVideoInModal = (element: CourseElement) => {
    setSelectedElement(element);
    setIsViewerOpen(true);
  };

  const openVideoInPictureInPicture = (element: CourseElement) => {
    if (element.google_drive_link) {
      openVideoInPiP(element.google_drive_link, element.title);
    }
  };

  const selectedFolderData = getAllFoldersForDisplay().find(f => f.id === selectedFolder);
  const canAddContent = selectedFolderData && !selectedFolderData.isShared;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Course Management</h1>
          <p className="text-muted-foreground">Organize your video learning content</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="button-elegant-outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                {selectedFolder ? 'New Subcourse' : 'New Course'}
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedFolder ? 'Create New Subcourse' : 'Create New Course'}
                </DialogTitle>
                <DialogDescription>
                  {selectedFolder 
                    ? `Create a new subcourse inside "${selectedFolderData?.name}"`
                    : 'Create a new course folder to organize your learning content.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="courseName" className="text-white">Course Name</Label>
                  <Input
                    id="courseName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter course name"
                    className="input-elegant"
                  />
                </div>
                <Button onClick={createFolder} disabled={!newFolderName.trim()} className="button-elegant w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create {selectedFolder ? 'Subcourse' : 'Course'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {selectedFolder && canAddContent && (
            <Dialog open={isElementDialogOpen} onOpenChange={setIsElementDialogOpen}>
              <DialogTrigger asChild>
                <Button className="button-elegant">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent className="elegant-card">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Course Element</DialogTitle>
                  <DialogDescription>
                    Add a new video or content to your course.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="elementTitle" className="text-white">Title</Label>
                    <Input
                      id="elementTitle"
                      value={newElement.title}
                      onChange={(e) => setNewElement({ ...newElement, title: e.target.value })}
                      placeholder="Enter element title"
                      className="input-elegant"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driveLink" className="text-white">Google Drive Video Link</Label>
                    <Input
                      id="driveLink"
                      value={newElement.google_drive_link}
                      onChange={(e) => setNewElement({ ...newElement, google_drive_link: e.target.value })}
                      placeholder="Paste Google Drive video link"
                      className="input-elegant"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={newElement.description}
                      onChange={(e) => setNewElement({ ...newElement, description: e.target.value })}
                      placeholder="Enter description (optional)"
                      className="input-elegant"
                    />
                  </div>
                  <Button onClick={createElement} disabled={!newElement.title.trim()} className="button-elegant w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Element
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Courses</h3>
          <div className="space-y-2">
            {renderFolderTree()}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedFolder ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                {selectedFolderData?.name} Content
                {selectedFolderData?.isShared && (
                  <span className="ml-2 text-sm text-blue-400">
                    (Shared - {getSharedFolderPermission(selectedFolder)} access)
                  </span>
                )}
              </h3>
              <div className="space-y-4">
                {filteredElements.map((element, index) => (
                  <Card key={element.id} className="elegant-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm flex items-center">
                          <Video className="h-4 w-4 mr-2" />
                          {element.course_order}. {element.title}
                        </CardTitle>
                        {element.user_id === user?.id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(element)}
                              className="h-8 w-8 p-0 border-gray-400 text-gray-400 hover:bg-gray-700 hover:border-gray-300"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteElement(element.id)}
                              className="h-8 w-8 p-0 border-gray-400 text-gray-400 hover:bg-red-500 hover:border-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {element.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {element.description}
                        </p>
                      )}
                      {element.google_drive_link && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openVideoInModal(element)}
                            className="button-elegant"
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Watch Full Screen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openVideoInPictureInPicture(element)}
                            className={`button-elegant-outline ${
                              isVideoInPiP(element.google_drive_link) ? 'bg-white/20' : ''
                            }`}
                          >
                            <PictureInPicture className="h-3 w-3 mr-1" />
                            PiP Mode
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a course to view content
            </div>
          )}
        </div>
      </div>

      {/* Folder Share Manager */}
      {sharingFolder && (
        <FolderShareManager
          folderId={sharingFolder.id}
          folderName={sharingFolder.name}
          onClose={() => setSharingFolder(null)}
        />
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Course Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCourseName" className="text-white">Course Name</Label>
              <Input
                id="editCourseName"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className="input-elegant"
              />
            </div>
            <Button onClick={updateFolder} className="button-elegant w-full">
              Update Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Element Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Course Element</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTitle" className="text-white">Title</Label>
              <Input
                id="editTitle"
                value={editElement.title}
                onChange={(e) => setEditElement({ ...editElement, title: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editDriveLink" className="text-white">Google Drive Video Link</Label>
              <Input
                id="editDriveLink"
                value={editElement.google_drive_link}
                onChange={(e) => setEditElement({ ...editElement, google_drive_link: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editDescription" className="text-white">Description</Label>
              <Textarea
                id="editDescription"
                value={editElement.description}
                onChange={(e) => setEditElement({ ...editElement, description: e.target.value })}
                className="input-elegant"
              />
            </div>
            <Button onClick={updateElement} className="button-elegant w-full">
              Update Element
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-6xl h-[90vh] elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedElement?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden rounded-lg">
            {selectedElement?.google_drive_link && getEmbedUrl(selectedElement.google_drive_link) ? (
              <iframe
                src={getEmbedUrl(selectedElement.google_drive_link)!}
                className="w-full h-full border-0 rounded-lg"
                title={selectedElement.title}
                allowFullScreen
                style={{ aspectRatio: '16/9' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-gray-900 rounded-lg">
                No valid video link available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
