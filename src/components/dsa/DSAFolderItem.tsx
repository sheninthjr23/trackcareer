import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, FolderOpen, Trash2, Edit } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
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

interface DSAFolderItemProps {
  folder: DSAFolder;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  children?: React.ReactNode;
  onToggleExpanded: (folderId: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onStartEdit: (folder: DSAFolder) => void;
  onCancelEdit: () => void;
  onSaveEdit: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
  onEditingNameChange: (name: string) => void;
}

export const DSAFolderItem: React.FC<DSAFolderItemProps> = ({
  folder,
  level,
  hasChildren,
  isExpanded,
  isSelected,
  isEditing,
  editingName,
  children,
  onToggleExpanded,
  onFolderSelect,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditingNameChange,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
  });

  return (
    <div className="space-y-1 relative">
      <div 
        ref={setNodeRef}
        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
          isSelected ? 'bg-primary/10 border-primary/30' : 'border-transparent'
        } ${isOver ? 'bg-primary/20 border-primary border-dashed shadow-md scale-105' : 'hover:bg-muted/50'}`}
        style={{ marginLeft: `${level * 16}px` }}
        title={isOver ? "Drop problem here to move it to this folder" : `Click to select ${folder.name} folder`}
      >
        {isOver && (
          <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md z-10">
            Drop here
          </div>
        )}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onToggleExpanded(folder.id)}
          >
            {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          </Button>
        )}
        
        {!hasChildren && <div className="w-6" />}
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit(folder.id, editingName);
                } else if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => onSaveEdit(folder.id, editingName)}
              disabled={!editingName.trim()}
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
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
                  onStartEdit(folder);
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
                      onClick={() => onDelete(folder.id)}
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
      
      {hasChildren && isExpanded && children && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};