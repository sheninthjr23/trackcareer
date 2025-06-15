import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Edit, Save, Trash2, MoreVertical, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DoubtFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface DoubtQuestion {
  id: string;
  title: string;
  markdown_content: string;
  folder_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function DoubtManager() {
  const [folders, setFolders] = useState<DoubtFolder[]>([]);
  const [questions, setQuestions] = useState<DoubtQuestion[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<DoubtQuestion | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DoubtFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'folder' | 'question'; id: string; name: string } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchQuestions();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('doubt_folders')
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

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('doubt_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions.",
        variant: "destructive",
      });
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('doubt_folders')
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

  const createQuestion = async () => {
    if (!newQuestionTitle.trim() || !selectedFolder || !user) return;

    try {
      const { error } = await supabase
        .from('doubt_questions')
        .insert({
          title: newQuestionTitle.trim(),
          folder_id: selectedFolder,
          user_id: user.id,
          markdown_content: '',
        });

      if (error) throw error;

      setNewQuestionTitle('');
      setIsQuestionDialogOpen(false);
      fetchQuestions();
      toast({
        title: "Success",
        description: "Question created successfully.",
      });
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to create question.",
        variant: "destructive",
      });
    }
  };

  const openEditor = (question: DoubtQuestion) => {
    setSelectedQuestion(question);
    setMarkdownContent(question.markdown_content || '');
    setIsEditMode(false); // Start in preview mode
    setIsEditorOpen(true);
  };

  const saveMarkdown = async () => {
    if (!selectedQuestion) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doubt_questions')
        .update({
          markdown_content: markdownContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedQuestion.id);

      if (error) throw error;

      fetchQuestions();
      toast({
        title: "Success",
        description: "Notes saved successfully.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFolder = async () => {
    if (!editFolderName.trim() || !editingFolder) return;

    try {
      const { error } = await supabase
        .from('doubt_folders')
        .update({
          name: editFolderName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingFolder.id);

      if (error) throw error;

      setEditFolderName('');
      setEditingFolder(null);
      setIsEditFolderDialogOpen(false);
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

  const deleteItem = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'folder') {
        // First delete all questions in the folder
        await supabase
          .from('doubt_questions')
          .delete()
          .eq('folder_id', itemToDelete.id);

        // Then delete the folder
        const { error } = await supabase
          .from('doubt_folders')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        if (selectedFolder === itemToDelete.id) {
          setSelectedFolder(null);
        }
        fetchFolders();
        fetchQuestions();
      } else {
        const { error } = await supabase
          .from('doubt_questions')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;
        fetchQuestions();
      }

      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({
        title: "Success",
        description: `${itemToDelete.type === 'folder' ? 'Folder' : 'Question'} deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: `Failed to delete ${itemToDelete.type}.`,
        variant: "destructive",
      });
    }
  };

  const openEditFolder = (folder: DoubtFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsEditFolderDialogOpen(true);
  };

  const openDeleteConfirm = (type: 'folder' | 'question', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const filteredQuestions = selectedFolder
    ? questions.filter(question => question.folder_id === selectedFolder)
    : [];

  const renderMarkdownPreview = (content: string) => {
    if (!content.trim()) {
      return '<p class="text-muted-foreground">No content yet. Start writing in the editor...</p>';
    }

    let html = content
      // Headers (must be processed first)
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mb-3 mt-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4 mt-4">$1</h1>')
      
      // Code blocks (must be before inline code)
      .replace(/```([a-zA-Z]*)\n([\s\S]*?)```/gim, '<pre class="bg-gray-800 p-3 rounded-md my-3 overflow-x-auto border border-gray-700"><code class="text-green-400 text-sm language-$1">$2</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-800 px-2 py-1 rounded text-green-400 text-sm font-mono">$1</code>')
      
      // Todo lists (must be before regular lists)
      .replace(/^(\s*)-\s*\[\s*\]\s*(.*)$/gim, '<div class="flex items-start gap-2 mb-1 ml-4"><input type="checkbox" class="mt-1 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" disabled> <span class="text-gray-300">$2</span></div>')
      .replace(/^(\s*)-\s*\[x\]\s*(.*)$/gim, '<div class="flex items-start gap-2 mb-1 ml-4"><input type="checkbox" checked class="mt-1 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" disabled> <span class="text-gray-300 line-through opacity-60">$2</span></div>')
      
      // Numbered todo lists
      .replace(/^(\s*)\d+\.\s*\[\s*\]\s*(.*)$/gim, '<div class="flex items-start gap-2 mb-1 ml-4"><input type="checkbox" class="mt-1 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" disabled> <span class="text-gray-300">$2</span></div>')
      .replace(/^(\s*)\d+\.\s*\[x\]\s*(.*)$/gim, '<div class="flex items-start gap-2 mb-1 ml-4"><input type="checkbox" checked class="mt-1 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" disabled> <span class="text-gray-300 line-through opacity-60">$2</span></div>')
      
      // Bold and italic (must be before other formatting)
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="font-bold text-white"><em class="italic">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-300">$1</em>')
      
      // Strikethrough
      .replace(/~~(.*?)~~/gim, '<del class="line-through text-gray-400">$1</del>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-md border border-gray-700 my-2">')
      
      // Blockquotes
      .replace(/^>\s*(.*)$/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-500/10 text-gray-300 italic">$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="border-gray-600 my-4">')
      .replace(/^\*\*\*$/gim, '<hr class="border-gray-600 my-4">')
      
      // Unordered lists (bullets)
      .replace(/^(\s*)-\s+(.*)$/gim, '<li class="text-gray-300 ml-4 mb-1 flex items-start"><span class="text-blue-400 mr-2 mt-1">•</span><span>$2</span></li>')
      .replace(/^(\s*)\*\s+(.*)$/gim, '<li class="text-gray-300 ml-4 mb-1 flex items-start"><span class="text-blue-400 mr-2 mt-1">•</span><span>$2</span></li>')
      .replace(/^(\s*)\+\s+(.*)$/gim, '<li class="text-gray-300 ml-4 mb-1 flex items-start"><span class="text-blue-400 mr-2 mt-1">•</span><span>$2</span></li>')
      
      // Ordered lists (numbers)
      .replace(/^(\s*)\d+\.\s+(.*)$/gim, '<li class="text-gray-300 ml-4 mb-1 list-decimal list-inside">$2</li>')
      
      // Tables
      .replace(/\|(.+)\|/gim, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell);
        const isHeader = content.includes('---');
        if (isHeader) return ''; // Skip separator rows
        const cellTag = cells.some((cell: string) => cell.includes('---')) ? 'th' : 'td';
        const cellClass = cellTag === 'th' ? 'font-semibold text-white bg-gray-800' : 'text-gray-300';
        return `<tr class="border-b border-gray-700">${cells.map((cell: string) => `<${cellTag} class="px-4 py-2 text-left ${cellClass}">${cell}</${cellTag}>`).join('')}</tr>`;
      })
      .replace(/(<tr.*<\/tr>)/gim, '<table class="w-full border-collapse border border-gray-700 my-3 rounded-md overflow-hidden">$1</table>')
      
      // Line breaks and paragraphs
      .replace(/\n\n+/gim, '</p><p class="text-gray-300 mb-3">')
      .replace(/\n/gim, '<br>');

    // Wrap in paragraph tags if not already wrapped in block elements
    if (!html.match(/^<(h[1-6]|p|div|pre|blockquote|ul|ol|li|table|tr)/)) {
      html = `<p class="text-gray-300 mb-3">${html}</p>`;
    }

    return html;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Doubt & Notes</h1>
          <p className="text-muted-foreground">Organize your questions and markdown notes</p>
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
                  Create a new folder to organize your questions and notes.
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
            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="button-elegant">
                  <Plus className="h-4 w-4 mr-2" />
                  New Question
                </Button>
              </DialogTrigger>
              <DialogContent className="elegant-card">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Question</DialogTitle>
                  <DialogDescription>
                    Add a new question to your selected folder.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="questionTitle" className="text-white">Question Title</Label>
                    <Input
                      id="questionTitle"
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      placeholder="Enter question title"
                      className="input-elegant"
                    />
                  </div>
                  <Button onClick={createQuestion} disabled={!newQuestionTitle.trim()} className="button-elegant w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Question
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="text-white text-sm flex items-center flex-1"
                      onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      {folder.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                        <DropdownMenuItem onClick={() => openEditFolder(folder)} className="text-white hover:bg-gray-800">
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirm('folder', folder.id, folder.name)}
                          className="text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    {questions.filter(q => q.folder_id === folder.id).length} questions
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
                Questions in {folders.find(f => f.id === selectedFolder)?.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((question) => (
                  <Card key={question.id} className="elegant-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm flex-1">
                          {question.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                            <DropdownMenuItem 
                              onClick={() => openDeleteConfirm('question', question.id, question.title)}
                              className="text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-xs mb-3">
                        {new Date(question.created_at).toLocaleDateString()}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => openEditor(question)}
                        className="button-elegant w-full"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Notes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a folder to view questions
            </div>
          )}
        </div>
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
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
            <Button onClick={updateFolder} disabled={!editFolderName.trim()} className="button-elegant w-full">
              <Save className="h-4 w-4 mr-2" />
              Update Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="elegant-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? 
              {itemToDelete?.type === 'folder' && ' This will also delete all questions in this folder.'} 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Markdown Editor Modal with preview-first approach */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl h-[90vh] elegant-card p-0">
          <div className="flex flex-col h-full">
            {/* Header with question title and action buttons */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <DialogTitle className="text-white text-lg font-semibold truncate flex-1 mr-4">
                {selectedQuestion?.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!isEditMode ? (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    variant="outline"
                    className="button-elegant-outline flex-shrink-0"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsEditMode(false)}
                      variant="outline"
                      className="button-elegant-outline flex-shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={saveMarkdown}
                      disabled={saving}
                      className="button-elegant flex-shrink-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Content area - preview only or editor + preview */}
            <div className="flex-1 p-4 overflow-hidden">
              {!isEditMode ? (
                /* Preview only mode */
                <div className="flex flex-col h-full">
                  <Label className="text-white mb-2 text-sm">Preview</Label>
                  <div 
                    className="flex-1 p-4 bg-background/50 border border-white/20 rounded-md overflow-auto prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(markdownContent) }}
                  />
                </div>
              ) : (
                /* Edit mode - both editor and preview */
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="flex flex-col">
                    <Label className="text-white mb-2 text-sm">Markdown Editor</Label>
                    <Textarea
                      value={markdownContent}
                      onChange={(e) => setMarkdownContent(e.target.value)}
                      placeholder="Write your notes in markdown format..."
                      className="flex-1 resize-none input-elegant font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-white mb-2 text-sm">Live Preview</Label>
                    <div 
                      className="flex-1 p-4 bg-background/50 border border-white/20 rounded-md overflow-auto prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(markdownContent) }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
