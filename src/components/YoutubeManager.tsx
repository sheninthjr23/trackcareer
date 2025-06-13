
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Video, CheckSquare, Trash2, Edit, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface YoutubeFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface YoutubeVideo {
  id: string;
  title: string;
  content: string | null;
  youtube_url: string | null;
  status: string;
  folder_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface YoutubeTodo {
  id: string;
  title: string;
  content: string | null;
  status: string;
  folder_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function YoutubeManager() {
  const [folders, setFolders] = useState<YoutubeFolder[]>([]);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [todos, setTodos] = useState<YoutubeTodo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newVideo, setNewVideo] = useState({
    title: '',
    content: '',
    youtube_url: '',
    status: 'pending',
  });
  const [newTodo, setNewTodo] = useState({
    title: '',
    content: '',
    status: 'pending',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchVideos();
      fetchTodos();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_folders')
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

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos.",
        variant: "destructive",
      });
    }
  };

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch todos.",
        variant: "destructive",
      });
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('youtube_folders')
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

  const createVideo = async () => {
    if (!newVideo.title.trim() || !selectedFolder || !user) return;

    try {
      const { error } = await supabase
        .from('youtube_videos')
        .insert({
          title: newVideo.title.trim(),
          content: newVideo.content.trim(),
          youtube_url: newVideo.youtube_url.trim() || null,
          status: newVideo.status,
          folder_id: selectedFolder,
          user_id: user.id,
        });

      if (error) throw error;

      setNewVideo({ title: '', content: '', youtube_url: '', status: 'pending' });
      setIsVideoDialogOpen(false);
      fetchVideos();
      toast({
        title: "Success",
        description: "Video created successfully.",
      });
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Error",
        description: "Failed to create video.",
        variant: "destructive",
      });
    }
  };

  const createTodo = async () => {
    if (!newTodo.title.trim() || !selectedFolder || !user) return;

    try {
      const { error } = await supabase
        .from('youtube_todos')
        .insert({
          title: newTodo.title.trim(),
          content: newTodo.content.trim(),
          status: newTodo.status,
          folder_id: selectedFolder,
          user_id: user.id,
        });

      if (error) throw error;

      setNewTodo({ title: '', content: '', status: 'pending' });
      setIsTodoDialogOpen(false);
      fetchTodos();
      toast({
        title: "Success",
        description: "Todo created successfully.",
      });
    } catch (error) {
      console.error('Error creating todo:', error);
      toast({
        title: "Error",
        description: "Failed to create todo.",
        variant: "destructive",
      });
    }
  };

  const updateVideoStatus = async (videoId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .update({ status })
        .eq('id', videoId);

      if (error) throw error;
      fetchVideos();
      toast({
        title: "Success",
        description: "Video status updated.",
      });
    } catch (error) {
      console.error('Error updating video status:', error);
      toast({
        title: "Error",
        description: "Failed to update video status.",
        variant: "destructive",
      });
    }
  };

  const updateTodoStatus = async (todoId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('youtube_todos')
        .update({ status })
        .eq('id', todoId);

      if (error) throw error;
      fetchTodos();
      toast({
        title: "Success",
        description: "Todo status updated.",
      });
    } catch (error) {
      console.error('Error updating todo status:', error);
      toast({
        title: "Error",
        description: "Failed to update todo status.",
        variant: "destructive",
      });
    }
  };

  const filteredVideos = selectedFolder
    ? videos.filter(video => video.folder_id === selectedFolder)
    : [];

  const filteredTodos = selectedFolder
    ? todos.filter(todo => todo.folder_id === selectedFolder)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-500" />
            YouTube Management
          </h1>
          <p className="text-muted-foreground">Organize your YouTube learning content and todos</p>
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
                  Create a new folder to organize your YouTube content.
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

          {selectedFolder && (
            <>
              <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="button-elegant">
                    <Video className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="elegant-card">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add YouTube Video</DialogTitle>
                    <DialogDescription>
                      Add a new YouTube video to track.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="videoTitle" className="text-white">Title</Label>
                      <Input
                        id="videoTitle"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                        placeholder="Enter video title"
                        className="input-elegant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtubeUrl" className="text-white">YouTube URL</Label>
                      <Input
                        id="youtubeUrl"
                        value={newVideo.youtube_url}
                        onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
                        placeholder="Enter YouTube URL"
                        className="input-elegant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="videoContent" className="text-white">Notes</Label>
                      <Textarea
                        id="videoContent"
                        value={newVideo.content}
                        onChange={(e) => setNewVideo({ ...newVideo, content: e.target.value })}
                        placeholder="Enter notes about the video"
                        className="input-elegant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="videoStatus" className="text-white">Status</Label>
                      <Select value={newVideo.status} onValueChange={(value) => setNewVideo({ ...newVideo, status: value })}>
                        <SelectTrigger className="input-elegant">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="watching">Watching</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createVideo} disabled={!newVideo.title.trim()} className="button-elegant w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isTodoDialogOpen} onOpenChange={setIsTodoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="button-elegant-outline">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Add Todo
                  </Button>
                </DialogTrigger>
                <DialogContent className="elegant-card">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Todo</DialogTitle>
                    <DialogDescription>
                      Add a new todo item to track.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="todoTitle" className="text-white">Title</Label>
                      <Input
                        id="todoTitle"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        placeholder="Enter todo title"
                        className="input-elegant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="todoContent" className="text-white">Description</Label>
                      <Textarea
                        id="todoContent"
                        value={newTodo.content}
                        onChange={(e) => setNewTodo({ ...newTodo, content: e.target.value })}
                        placeholder="Enter todo description"
                        className="input-elegant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="todoStatus" className="text-white">Status</Label>
                      <Select value={newTodo.status} onValueChange={(value) => setNewTodo({ ...newTodo, status: value })}>
                        <SelectTrigger className="input-elegant">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createTodo} disabled={!newTodo.title.trim()} className="button-elegant w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Todo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Folders</h3>
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
                    {videos.filter(v => v.folder_id === folder.id).length} videos, {todos.filter(t => t.folder_id === folder.id).length} todos
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedFolder ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Videos</h3>
                <div className="space-y-4">
                  {filteredVideos.map((video) => (
                    <Card key={video.id} className="elegant-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center justify-between">
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-2" />
                            {video.title}
                          </div>
                          <div className="flex gap-2">
                            <Select value={video.status} onValueChange={(value) => updateVideoStatus(video.id, value)}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="watching">Watching</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {video.content && (
                          <p className="text-muted-foreground text-sm mb-3">
                            {video.content}
                          </p>
                        )}
                        {video.youtube_url && (
                          <a
                            href={video.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-400 text-sm"
                          >
                            Watch on YouTube
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Todos</h3>
                <div className="space-y-4">
                  {filteredTodos.map((todo) => (
                    <Card key={todo.id} className="elegant-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckSquare className="h-4 w-4 mr-2" />
                            {todo.title}
                          </div>
                          <div className="flex gap-2">
                            <Select value={todo.status} onValueChange={(value) => updateTodoStatus(todo.id, value)}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      {todo.content && (
                        <CardContent>
                          <p className="text-muted-foreground text-sm">
                            {todo.content}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a folder to view content
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
