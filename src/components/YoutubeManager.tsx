import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Video, CheckSquare, Trash2, Edit, Youtube, Folder, Play, Clock, CheckCircle, TrendingUp, BookOpen, Target } from 'lucide-react';
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
  const [editingVideo, setEditingVideo] = useState<YoutubeVideo | null>(null);
  const [editingTodo, setEditingTodo] = useState<YoutubeTodo | null>(null);
  const [editingFolder, setEditingFolder] = useState<YoutubeFolder | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [isEditVideoDialogOpen, setIsEditVideoDialogOpen] = useState(false);
  const [isEditTodoDialogOpen, setIsEditTodoDialogOpen] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editFolderName, setEditFolderName] = useState('');
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
  const [editVideo, setEditVideo] = useState({
    title: '',
    content: '',
    youtube_url: '',
    status: 'pending',
  });
  const [editTodo, setEditTodo] = useState({
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
    if (!editingFolder || !editFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('youtube_folders')
        .update({ name: editFolderName.trim() })
        .eq('id', editingFolder.id);

      if (error) throw error;

      setIsEditFolderDialogOpen(false);
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

  const deleteFolder = async (folderId: string) => {
    try {
      // First check if folder has any content
      const [videosInFolder, todosInFolder, subFolders] = await Promise.all([
        supabase.from('youtube_videos').select('id').eq('folder_id', folderId),
        supabase.from('youtube_todos').select('id').eq('folder_id', folderId),
        supabase.from('youtube_folders').select('id').eq('parent_folder_id', folderId)
      ]);

      const hasContent = 
        (videosInFolder.data && videosInFolder.data.length > 0) ||
        (todosInFolder.data && todosInFolder.data.length > 0) ||
        (subFolders.data && subFolders.data.length > 0);

      if (hasContent) {
        toast({
          title: "Cannot Delete",
          description: "Folder contains videos, todos, or subfolders. Please remove them first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('youtube_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      if (selectedFolder === folderId) {
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

  const updateVideo = async () => {
    if (!editingVideo || !editVideo.title.trim()) return;

    try {
      const { error } = await supabase
        .from('youtube_videos')
        .update({
          title: editVideo.title.trim(),
          content: editVideo.content.trim(),
          youtube_url: editVideo.youtube_url.trim() || null,
          status: editVideo.status,
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      setIsEditVideoDialogOpen(false);
      setEditingVideo(null);
      fetchVideos();
      toast({
        title: "Success",
        description: "Video updated successfully.",
      });
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video.",
        variant: "destructive",
      });
    }
  };

  const updateVideoStatus = async (videoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .update({ status: newStatus })
        .eq('id', videoId);

      if (error) throw error;
      fetchVideos();
    } catch (error) {
      console.error('Error updating video status:', error);
      toast({
        title: "Error",
        description: "Failed to update video status.",
        variant: "destructive",
      });
    }
  };

  const updateTodo = async () => {
    if (!editingTodo || !editTodo.title.trim()) return;

    try {
      const { error } = await supabase
        .from('youtube_todos')
        .update({
          title: editTodo.title.trim(),
          content: editTodo.content.trim(),
          status: editTodo.status,
        })
        .eq('id', editingTodo.id);

      if (error) throw error;

      setIsEditTodoDialogOpen(false);
      setEditingTodo(null);
      fetchTodos();
      toast({
        title: "Success",
        description: "Todo updated successfully.",
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error",
        description: "Failed to update todo.",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      fetchVideos();
      toast({
        title: "Success",
        description: "Video deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('youtube_todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;

      fetchTodos();
      toast({
        title: "Success",
        description: "Todo deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({
        title: "Error",
        description: "Failed to delete todo.",
        variant: "destructive",
      });
    }
  };

  const toggleTodoStatus = async (todo: YoutubeTodo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('youtube_todos')
        .update({ status: newStatus })
        .eq('id', todo.id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const openEditVideoDialog = (video: YoutubeVideo) => {
    setEditingVideo(video);
    setEditVideo({
      title: video.title,
      content: video.content || '',
      youtube_url: video.youtube_url || '',
      status: video.status,
    });
    setIsEditVideoDialogOpen(true);
  };

  const openEditTodoDialog = (todo: YoutubeTodo) => {
    setEditingTodo(todo);
    setEditTodo({
      title: todo.title,
      content: todo.content || '',
      status: todo.status,
    });
    setIsEditTodoDialogOpen(true);
  };

  const openEditFolderDialog = (folder: YoutubeFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsEditFolderDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'watching':
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'watching':
      case 'in-progress':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
    const childFolders = folders.filter(folder => folder.parent_folder_id === parentId);
    
    return childFolders.map((folder) => (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }} className="group">
        <Card 
          className={`elegant-card cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl mb-3 border-2 ${
            selectedFolder === folder.id 
              ? 'ring-2 ring-red-500 border-red-500/30 bg-gradient-to-r from-red-500/5 to-transparent' 
              : 'border-white/10 hover:border-red-500/30'
          }`}
          onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${selectedFolder === folder.id ? 'bg-red-500' : 'bg-white/10'}`}>
                  {level > 0 ? 
                    <Folder className={`h-4 w-4 ${selectedFolder === folder.id ? 'text-white' : 'text-red-500'}`} /> : 
                    <FolderOpen className={`h-4 w-4 ${selectedFolder === folder.id ? 'text-white' : 'text-red-500'}`} />
                  }
                </div>
                <span className="font-semibold">{folder.name}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditFolderDialog(folder)}
                  className="button-elegant-outline h-7 w-7 p-0 hover:bg-blue-500 hover:border-blue-500"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteFolder(folder.id)}
                  className="button-elegant-outline h-7 w-7 p-0 hover:bg-red-500 hover:border-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                <span>{videos.filter(v => v.folder_id === folder.id).length} videos</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{todos.filter(t => t.folder_id === folder.id).length} tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {renderFolderTree(folder.id, level + 1)}
      </div>
    ));
  };

  const filteredVideos = selectedFolder
    ? videos.filter(video => video.folder_id === selectedFolder)
    : [];

  const filteredTodos = selectedFolder
    ? todos.filter(todo => todo.folder_id === selectedFolder)
    : [];

  const completedVideos = filteredVideos.filter(v => v.status === 'completed').length;
  const completedTodos = filteredTodos.filter(t => t.status === 'completed').length;

  const totalVideos = videos.length;
  const totalCompletedVideos = videos.filter(v => v.status === 'completed').length;
  const totalTodos = todos.length;
  const totalCompletedTodos = todos.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl border border-white/10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl">
            <Youtube className="h-12 w-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">YouTube Learning Hub</h1>
            <p className="text-xl text-muted-foreground">Transform your YouTube consumption into structured learning</p>
          </div>
        </div>
        
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-8">
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{folders.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Learning Folders</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Video className="h-5 w-5 text-red-400" />
              <span className="text-2xl font-bold text-white">{totalVideos}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Videos</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{totalCompletedVideos}</span>
            </div>
            <p className="text-sm text-muted-foreground">Completed Videos</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{totalCompletedTodos}</span>
            </div>
            <p className="text-sm text-muted-foreground">Tasks Done</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Manage Content</h2>
          {selectedFolder && (
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm">
              {folders.find(f => f.id === selectedFolder)?.name}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="button-elegant-outline hover:bg-blue-500 hover:border-blue-500">
                <FolderOpen className="h-4 w-4 mr-2" />
                {selectedFolder ? 'New Subfolder' : 'New Folder'}
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-400" />
                  {selectedFolder ? 'Create New Subfolder' : 'Create New Folder'}
                </DialogTitle>
                <DialogDescription>
                  {selectedFolder 
                    ? `Create a new subfolder inside "${folders.find(f => f.id === selectedFolder)?.name}"`
                    : 'Create a new folder to organize your YouTube content.'
                  }
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
                    className="input-elegant mt-2"
                  />
                </div>
                <Button onClick={createFolder} disabled={!newFolderName.trim()} className="button-elegant w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create {selectedFolder ? 'Subfolder' : 'Folder'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {selectedFolder && (
            <>
              <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="button-elegant bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700">
                    <Video className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="elegant-card max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Video className="h-5 w-5 text-red-400" />
                      Add YouTube Video
                    </DialogTitle>
                    <DialogDescription>
                      Add a new YouTube video to your learning collection.
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
                        className="input-elegant mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtubeUrl" className="text-white">YouTube URL</Label>
                      <Input
                        id="youtubeUrl"
                        value={newVideo.youtube_url}
                        onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="input-elegant mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="videoContent" className="text-white">Learning Notes</Label>
                      <Textarea
                        id="videoContent"
                        value={newVideo.content}
                        onChange={(e) => setNewVideo({ ...newVideo, content: e.target.value })}
                        placeholder="What will you learn from this video?"
                        className="input-elegant mt-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="videoStatus" className="text-white">Status</Label>
                      <Select value={newVideo.status} onValueChange={(value) => setNewVideo({ ...newVideo, status: value })}>
                        <SelectTrigger className="input-elegant mt-2">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">📋 Pending</SelectItem>
                          <SelectItem value="watching">▶️ Watching</SelectItem>
                          <SelectItem value="completed">✅ Completed</SelectItem>
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
                  <Button variant="outline" className="button-elegant-outline hover:bg-purple-500 hover:border-purple-500">
                    <Target className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="elegant-card max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" />
                      Add Learning Task
                    </DialogTitle>
                    <DialogDescription>
                      Create a task related to your learning goals.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="todoTitle" className="text-white">Task Title</Label>
                      <Input
                        id="todoTitle"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        placeholder="What do you need to do?"
                        className="input-elegant mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="todoContent" className="text-white">Description</Label>
                      <Textarea
                        id="todoContent"
                        value={newTodo.content}
                        onChange={(e) => setNewTodo({ ...newTodo, content: e.target.value })}
                        placeholder="Describe the task details..."
                        className="input-elegant mt-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="todoStatus" className="text-white">Priority</Label>
                      <Select value={newTodo.status} onValueChange={(value) => setNewTodo({ ...newTodo, status: value })}>
                        <SelectTrigger className="input-elegant mt-2">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">⏳ Pending</SelectItem>
                          <SelectItem value="in-progress">🔄 In Progress</SelectItem>
                          <SelectItem value="completed">✅ Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createTodo} disabled={!newTodo.title.trim()} className="button-elegant w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Progress Section */}
      {selectedFolder && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="elegant-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Video Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Completed</span>
                <span className="text-white font-bold text-xl">{completedVideos}/{filteredVideos.length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${filteredVideos.length > 0 ? (completedVideos / filteredVideos.length) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredVideos.length > 0 ? Math.round((completedVideos / filteredVideos.length) * 100) : 0}% complete
              </p>
            </CardContent>
          </Card>
          
          <Card className="elegant-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Task Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Completed</span>
                <span className="text-white font-bold text-xl">{completedTodos}/{filteredTodos.length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${filteredTodos.length > 0 ? (completedTodos / filteredTodos.length) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredTodos.length > 0 ? Math.round((completedTodos / filteredTodos.length) * 100) : 0}% complete
              </p>
            </CardContent>
          </Card>

          <Card className="elegant-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Learning Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Overall</span>
                <span className="text-white font-bold text-xl">
                  {filteredVideos.length + filteredTodos.length > 0 
                    ? Math.round(((completedVideos + completedTodos) / (filteredVideos.length + filteredTodos.length)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full transition-all duration-300 ease-out" 
                  style={{ 
                    width: `${(filteredVideos.length + filteredTodos.length) > 0 
                      ? ((completedVideos + completedTodos) / (filteredVideos.length + filteredTodos.length)) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">Combined progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-400" />
            Learning Folders
          </h3>
          <div className="space-y-2">
            {folders.length === 0 ? (
              <Card className="elegant-card text-center p-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No folders yet</p>
                <p className="text-sm text-muted-foreground">Create your first learning folder to get started</p>
              </Card>
            ) : (
              renderFolderTree()
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedFolder ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-400" />
                  YouTube Videos
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredVideos.map((video) => (
                    <Card key={video.id} className={`elegant-card group hover:shadow-xl transition-all duration-300 ${getStatusColor(video.status)}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-base flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {getStatusIcon(video.status)}
                            <span className="truncate">{video.title}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditVideoDialog(video)}
                              className="button-elegant-outline h-7 w-7 p-0 hover:bg-blue-500"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteVideo(video.id)}
                              className="button-elegant-outline h-7 w-7 p-0 hover:bg-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {video.content && (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {video.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {video.youtube_url && (
                            <a
                              href={video.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                            >
                              <Youtube className="h-4 w-4" />
                              Watch Video
                            </a>
                          )}
                          <Select value={video.status} onValueChange={(value) => updateVideoStatus(video.id, value)}>
                            <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="watching">Watching</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredVideos.length === 0 && (
                    <div className="xl:col-span-2">
                      <Card className="elegant-card text-center p-12">
                        <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-white text-lg font-semibold mb-2">No videos yet</h4>
                        <p className="text-muted-foreground mb-4">Start adding YouTube videos to track your learning</p>
                        <Button
                          onClick={() => setIsVideoDialogOpen(true)}
                          className="button-elegant"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Video
                        </Button>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Learning Tasks
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredTodos.map((todo) => (
                    <Card key={todo.id} className={`elegant-card group hover:shadow-xl transition-all duration-300 ${getStatusColor(todo.status)}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-base flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Checkbox
                              checked={todo.status === 'completed'}
                              onCheckedChange={() => toggleTodoStatus(todo)}
                              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                            {getStatusIcon(todo.status)}
                            <span className={`truncate ${todo.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                              {todo.title}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditTodoDialog(todo)}
                              className="button-elegant-outline h-7 w-7 p-0 hover:bg-blue-500"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTodo(todo.id)}
                              className="button-elegant-outline h-7 w-7 p-0 hover:bg-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      {todo.content && (
                        <CardContent>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {todo.content}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  {filteredTodos.length === 0 && (
                    <div className="xl:col-span-2">
                      <Card className="elegant-card text-center p-12">
                        <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-white text-lg font-semibold mb-2">No tasks yet</h4>
                        <p className="text-muted-foreground mb-4">Create learning tasks to track your progress</p>
                        <Button
                          onClick={() => setIsTodoDialogOpen(true)}
                          className="button-elegant"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Task
                        </Button>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Card className="elegant-card text-center p-16">
              <div className="max-w-md mx-auto">
                <div className="p-6 bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Select a Learning Folder</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Choose a folder from the sidebar to view and manage your YouTube videos and learning tasks
                </p>
                <p className="text-sm text-muted-foreground">
                  Start by creating your first folder to organize your learning content
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFolderName" className="text-white">Folder Name</Label>
              <Input
                id="editFolderName"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className="input-elegant"
              />
            </div>
            <Button onClick={updateFolder} className="button-elegant w-full">
              Update Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isEditVideoDialogOpen} onOpenChange={setIsEditVideoDialogOpen}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editVideoTitle" className="text-white">Title</Label>
              <Input
                id="editVideoTitle"
                value={editVideo.title}
                onChange={(e) => setEditVideo({ ...editVideo, title: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editYoutubeUrl" className="text-white">YouTube URL</Label>
              <Input
                id="editYoutubeUrl"
                value={editVideo.youtube_url}
                onChange={(e) => setEditVideo({ ...editVideo, youtube_url: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editVideoContent" className="text-white">Notes</Label>
              <Textarea
                id="editVideoContent"
                value={editVideo.content}
                onChange={(e) => setEditVideo({ ...editVideo, content: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editVideoStatus" className="text-white">Status</Label>
              <Select value={editVideo.status} onValueChange={(value) => setEditVideo({ ...editVideo, status: value })}>
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
            <Button onClick={updateVideo} disabled={!editVideo.title.trim()} className="button-elegant w-full">
              Update Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Todo Dialog */}
      <Dialog open={isEditTodoDialogOpen} onOpenChange={setIsEditTodoDialogOpen}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Todo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTodoTitle" className="text-white">Title</Label>
              <Input
                id="editTodoTitle"
                value={editTodo.title}
                onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editTodoContent" className="text-white">Description</Label>
              <Textarea
                id="editTodoContent"
                value={editTodo.content}
                onChange={(e) => setEditTodo({ ...editTodo, content: e.target.value })}
                className="input-elegant"
              />
            </div>
            <div>
              <Label htmlFor="editTodoStatus" className="text-white">Status</Label>
              <Select value={editTodo.status} onValueChange={(value) => setEditTodo({ ...editTodo, status: value })}>
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
            <Button onClick={updateTodo} disabled={!editTodo.title.trim()} className="button-elegant w-full">
              Update Todo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
