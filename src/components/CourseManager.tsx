
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Video, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CourseFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
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

export function CourseManager() {
  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [elements, setElements] = useState<CourseElement[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<CourseElement | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newElement, setNewElement] = useState({
    title: '',
    google_drive_link: '',
    description: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFolders();
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

  const createElement = async () => {
    if (!newElement.title.trim() || !selectedFolder || !user) return;

    try {
      // Get the next order number
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

  const filteredElements = selectedFolder
    ? elements
        .filter(element => element.folder_id === selectedFolder)
        .sort((a, b) => a.course_order - b.course_order)
    : [];

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
                New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Course</DialogTitle>
                <DialogDescription>
                  Create a new course folder to organize your learning content.
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
                  Create Course
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {selectedFolder && (
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
            {folders.map((folder) => (
              <Card 
                key={folder.id} 
                className={`elegant-card cursor-pointer transition-all hover:scale-105 ${
                  selectedFolder === folder.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {folder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    {elements.filter(e => e.folder_id === folder.id).length} elements
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedFolder ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {folders.find(f => f.id === selectedFolder)?.name} Content
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
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveElement(element, 'up')}
                            disabled={index === 0}
                            className="button-elegant-outline h-8 w-8 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveElement(element, 'down')}
                            disabled={index === filteredElements.length - 1}
                            className="button-elegant-outline h-8 w-8 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {element.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {element.description}
                        </p>
                      )}
                      {element.google_drive_link && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedElement(element);
                            setIsViewerOpen(true);
                          }}
                          className="button-elegant"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Watch Video
                        </Button>
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

      {/* Video Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-6xl h-[90vh] elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedElement?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {selectedElement?.google_drive_link && getEmbedUrl(selectedElement.google_drive_link) ? (
              <iframe
                src={getEmbedUrl(selectedElement.google_drive_link)!}
                className="w-full h-full rounded-lg border border-white/20"
                title={selectedElement.title}
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No valid video link available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
