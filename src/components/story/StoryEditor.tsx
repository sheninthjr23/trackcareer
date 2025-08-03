import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Share, 
  Download, 
  Wand2, 
  History, 
  Settings, 
  Layout,
  Palette,
  Type,
  Image,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { Database } from '@/integrations/supabase/types';

type Story = Database['public']['Tables']['stories']['Row'];
type StoryVersion = Database['public']['Tables']['story_versions']['Row'];

interface StoryEditorProps {
  story: Story;
  onClose: () => void;
  onSave: () => void;
}

export function StoryEditor({ story, onClose, onSave }: StoryEditorProps) {
  const [content, setContent] = useState(story.content || '');
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description || '');
  const [status, setStatus] = useState(story.status);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('serif');
  const [editorTheme, setEditorTheme] = useState('default');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-save functionality
  const autoSaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('stories')
        .update({
          title,
          description,
          content,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', story.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Auto-saved',
        description: 'Your changes have been saved automatically.',
      });
    }
  });

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('story_versions')
        .insert({
          story_id: story.id,
          title,
          content,
          description,
          version_number: Date.now() // Simple versioning
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story_versions', story.id] });
      toast({
        title: 'Version saved',
        description: 'A new version has been created.',
      });
    }
  });

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ['story_versions', story.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_versions')
        .select('*')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (content !== story.content || title !== story.title || description !== story.description) {
        autoSaveMutation.mutate();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [content, title, description, story]);

  const handleSave = () => {
    autoSaveMutation.mutate();
    onSave();
  };

  const handleCreateVersion = () => {
    createVersionMutation.mutate();
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + markdown + content.substring(end);
    setContent(newContent);

    // Reset cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
      textarea.focus();
    }, 0);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Here you would integrate with your AI service
      // For now, we'll simulate AI generation
      const aiResponse = `# AI Generated Content

Based on your prompt: "${aiPrompt}"

This is where AI-generated content would appear. The system would use the prompt to generate relevant content, expand on existing text, or provide creative suggestions.

## Key Points:
- AI can help with writer's block
- Generate outlines and structure
- Expand on existing ideas
- Provide creative alternatives

*This is a placeholder for actual AI integration.*`;

      setContent(content + '\n\n' + aiResponse);
      setShowAIDialog(false);
      setAiPrompt('');
      toast({
        title: 'AI content generated',
        description: 'AI-generated content has been added to your story.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate AI content.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const restoreVersion = (version: StoryVersion) => {
    setTitle(version.title);
    setContent(version.content);
    setDescription(version.description || '');
    setShowVersions(false);
    toast({
      title: 'Version restored',
      description: 'Story has been restored to the selected version.',
    });
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**bold**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*italic*'), title: 'Italic' },
    { icon: Underline, action: () => insertMarkdown('<u>underline</u>'), title: 'Underline' },
    { icon: List, action: () => insertMarkdown('\n- List item'), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('\n1. List item'), title: 'Numbered List' },
    { icon: Quote, action: () => insertMarkdown('\n> Quote'), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`code`'), title: 'Code' },
    { icon: Link, action: () => insertMarkdown('[link text](url)'), title: 'Link' },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto"
              placeholder="Story title..."
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm text-muted-foreground border-none p-0 h-auto"
              placeholder="Brief description..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status}
          </Badge>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowVersions(true)}>
            <History className="h-4 w-4 mr-2" />
            Versions
          </Button>
          <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Assist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Writing Assistant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want the AI to help you write..."
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAIGenerate} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-1">
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={button.action}
            title={button.title}
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-hidden">
        {isPreviewMode ? (
          <div 
            className="h-full p-8 overflow-y-auto prose dark:prose-invert max-w-none"
            style={{ 
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'sans' ? 'system-ui, sans-serif' : 'monospace'
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50}>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full resize-none border-none rounded-none focus-visible:ring-0"
                style={{ 
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'sans' ? 'system-ui, sans-serif' : 'monospace'
                }}
                placeholder="Start writing your story..."
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>
              <div 
                className="h-full p-8 overflow-y-auto prose dark:prose-invert max-w-none bg-muted/50"
                style={{ 
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'sans' ? 'system-ui, sans-serif' : 'monospace'
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {content || '*Preview will appear here as you type...*'}
                </ReactMarkdown>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Versions Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleCreateVersion} disabled={createVersionMutation.isPending}>
                Create New Version
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {versions.map((version) => (
                <Card key={version.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{version.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(version.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {version.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreVersion(version)}
                    >
                      Restore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editor Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Font Size</label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="18">18px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                  <SelectItem value="24">24px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Font Family</label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="sans">Sans Serif</SelectItem>
                  <SelectItem value="mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Editor Theme</label>
              <Select value={editorTheme} onValueChange={setEditorTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="focus">Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}