import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter, Eye, Edit, Trash2, Share, Download, BarChart, BookOpen, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { StoryEditor } from './story/StoryEditor';
import { StoryAnalytics } from './story/StoryAnalytics';
import { StoryExport } from './story/StoryExport';
// Define types directly since the database types might not be available yet
type Story = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  status: string;
  category_id: string | null;
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
};

type StoryCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

interface StoryManagerProps {
  className?: string;
}

export function StoryManager({ className }: StoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDescription, setNewStoryDescription] = useState('');
  const [newStoryCategory, setNewStoryCategory] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['story_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async ({ title, description, category_id }: { title: string; description: string; category_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('stories')
        .insert({
          title,
          description,
          category_id,
          user_id: user.id,
          content: '',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (story) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setIsNewStoryOpen(false);
      setNewStoryTitle('');
      setNewStoryDescription('');
      setNewStoryCategory('');
      setEditingStory(story);
      toast({
        title: 'Story created',
        description: 'Your new story has been created successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create story'
      });
    }
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({
        title: 'Story deleted',
        description: 'Story has been deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete story'
      });
    }
  });

  // Filter stories
  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || story.category_id === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || story.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateStory = () => {
    if (!newStoryTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a story title'
      });
      return;
    }

    createStoryMutation.mutate({
      title: newStoryTitle,
      description: newStoryDescription,
      category_id: newStoryCategory || categories[0]?.id || ''
    });
  };

  const handleDeleteStory = (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStoryMutation.mutate(storyId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (editingStory) {
    return (
      <StoryEditor
        story={editingStory}
        onClose={() => setEditingStory(null)}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['stories'] });
          setEditingStory(null);
        }}
      />
    );
  }

  if (showAnalytics) {
    return (
      <StoryAnalytics
        onClose={() => setShowAnalytics(false)}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Story Authoring</h1>
          <p className="text-muted-foreground">Create and manage your stories with AI assistance</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAnalytics(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            Analytics
          </Button>
          <Dialog open={isNewStoryOpen} onOpenChange={setIsNewStoryOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Story
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    placeholder="Enter story title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newStoryDescription}
                    onChange={(e) => setNewStoryDescription(e.target.value)}
                    placeholder="Brief description of your story"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newStoryCategory} onValueChange={setNewStoryCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewStoryOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStory}
                    disabled={createStoryMutation.isPending}
                  >
                    {createStoryMutation.isPending ? 'Creating...' : 'Create Story'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stories found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Create your first story to get started.'}
            </p>
            <Button onClick={() => setIsNewStoryOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Story
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                  <Badge className={`${getStatusColor(story.status)} text-white`}>
                    {story.status}
                  </Badge>
                </div>
                {story.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {story.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(story.updated_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingStory(story)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingStory(story)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <StoryExport story={story} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Story Preview Dialog */}
      <Dialog open={!!viewingStory} onOpenChange={() => setViewingStory(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingStory?.title}</DialogTitle>
          </DialogHeader>
          {viewingStory && (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {viewingStory.content || 'No content yet.'}
              </ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}