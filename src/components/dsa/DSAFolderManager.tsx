
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Folder, FolderOpen, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DSAFolderItem } from './DSAFolderItem';
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

    const childFolders = buildFolderTree(folders, folder.id);

    return (
      <DSAFolderItem
        key={folder.id}
        folder={folder}
        level={level}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isSelected={isSelected}
        isEditing={isEditing}
        editingName={editingName}
        onToggleExpanded={toggleExpanded}
        onFolderSelect={onFolderSelect}
        onStartEdit={(folder) => {
          setEditingFolderId(folder.id);
          setEditingName(folder.name);
        }}
        onCancelEdit={() => {
          setEditingFolderId(null);
          setEditingName('');
        }}
        onSaveEdit={(folderId, name) => {
          updateFolderMutation.mutate({ id: folderId, name });
        }}
        onDelete={(folderId) => {
          deleteFolderMutation.mutate(folderId);
        }}
        onEditingNameChange={setEditingName}
      >
        {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
      </DSAFolderItem>
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
