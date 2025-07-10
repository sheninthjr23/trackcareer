
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Folder, FolderOpen, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DSAFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DSAFolderManagerProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export const DSAFolderManager: React.FC<DSAFolderManagerProps> = ({
  selectedFolderId,
  onFolderSelect,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['dsa-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_folders')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DSAFolder[];
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string }) => {
      const { data, error } = await supabase
        .from('dsa_folders')
        .insert({
          name,
          parent_folder_id: parentId || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-folders'] });
      setNewFolderName('');
      toast({ title: 'Folder created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating folder', description: error.message, variant: 'destructive' });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('dsa_folders')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-folders'] });
      setEditingFolderId(null);
      setEditingName('');
      toast({ title: 'Folder updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating folder', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dsa_folders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-folders'] });
      if (selectedFolderId === editingFolderId) {
        onFolderSelect(null);
      }
      toast({ title: 'Folder deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting folder', description: error.message, variant: 'destructive' });
    },
  });

  const buildFolderTree = (folders: DSAFolder[], parentId: string | null = null): DSAFolder[] => {
    return folders
      .filter(folder => folder.parent_folder_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: DSAFolder, level: number = 0) => {
    const hasChildren = folders.some(f => f.parent_folder_id === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingFolderId === folder.id;

    return (
      <div key={folder.id} className="space-y-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 ${
            isSelected ? 'bg-primary/10 border border-primary/20' : ''
          }`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(folder.id)}
            >
              {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            </Button>
          )}
          
          {!hasChildren && <div className="w-6" />}
          
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateFolderMutation.mutate({ id: folder.id, name: editingName });
                  } else if (e.key === 'Escape') {
                    setEditingFolderId(null);
                    setEditingName('');
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => updateFolderMutation.mutate({ id: folder.id, name: editingName })}
                disabled={!editingName.trim()}
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingFolderId(null);
                  setEditingName('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <span 
                className="flex-1 text-sm"
                onClick={() => onFolderSelect(folder.id)}
              >
                {folder.name}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(folder.id);
                    setEditingName(folder.name);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{folder.name}"? This will also delete all problems in this folder. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteFolderMutation.mutate(folder.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {buildFolderTree(folders, folder.id).map(childFolder => 
              renderFolder(childFolder, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading folders...</div>;
  }

  const rootFolders = buildFolderTree(folders);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newFolderName.trim()) {
              createFolderMutation.mutate({ name: newFolderName });
            }
          }}
        />
        <Button
          onClick={() => createFolderMutation.mutate({ name: newFolderName })}
          disabled={!newFolderName.trim() || createFolderMutation.isPending}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {rootFolders.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No folders yet. Create your first folder to get started.
          </div>
        ) : (
          rootFolders.map(folder => renderFolder(folder))
        )}
      </div>
    </div>
  );
};
