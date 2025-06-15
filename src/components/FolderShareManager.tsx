
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Share2, X, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FolderShare {
  id: string;
  shared_with_email: string;
  permission_level: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface SharedFolder {
  folder_id: string;
  folder_name: string;
  shared_by_email: string | null;
  permission_level: string;
  shared_at: string;
}

interface FolderShareManagerProps {
  folderId: string;
  folderName: string;
  onClose: () => void;
}

export function FolderShareManager({ folderId, folderName, onClose }: FolderShareManagerProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shares, setShares] = useState<FolderShare[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('view');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (folderId && user) {
      fetchFolderShares();
    }
    if (user) {
      fetchSharedFolders();
    }
  }, [folderId, user]);

  const fetchFolderShares = async () => {
    if (!user) {
      console.log('No user available for fetching folder shares');
      return;
    }

    try {
      console.log('Fetching folder shares for folder:', folderId);
      const { data, error } = await supabase.rpc('get_folder_shares', {
        folder_uuid: folderId
      });

      if (error) {
        console.error('Error from get_folder_shares:', error);
        throw error;
      }
      console.log('Folder shares fetched successfully:', data);
      setShares(data || []);
    } catch (error) {
      console.error('Error fetching folder shares:', error);
      toast({
        title: "Error",
        description: "Failed to fetch folder shares.",
        variant: "destructive",
      });
    }
  };

  const fetchSharedFolders = async () => {
    if (!user) {
      console.log('No user available for fetching shared folders');
      return;
    }

    try {
      console.log('Fetching shared folders for user');
      const { data, error } = await supabase.rpc('get_shared_folders_for_user');

      if (error) {
        console.error('Error from get_shared_folders_for_user:', error);
        throw error;
      }
      console.log('Shared folders fetched successfully:', data);
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

  const shareFolder = async () => {
    if (!shareEmail.trim() || !folderId || !user) {
      toast({
        title: "Error",
        description: "Please provide an email address and ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    const trimmedEmail = shareEmail.trim().toLowerCase();

    // Check if this folder is already shared with this email
    const existingShare = shares.find(share => 
      share.shared_with_email.toLowerCase() === trimmedEmail && share.is_active
    );

    if (existingShare) {
      toast({
        title: "Already Shared",
        description: `This folder is already shared with ${trimmedEmail}. You can update the permission level or remove the existing share first.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Sharing folder with:', trimmedEmail);
      const { error } = await supabase
        .from('folder_shares')
        .insert({
          folder_id: folderId,
          shared_by: user.id,
          shared_with_email: trimmedEmail,
          permission_level: permissionLevel,
        });

      if (error) {
        console.error('Error sharing folder:', error);
        // Handle the specific duplicate key error
        if (error.code === '23505') {
          toast({
            title: "Already Shared",
            description: `This folder is already shared with ${trimmedEmail}. Please check the existing shares below.`,
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      console.log('Folder shared successfully');
      setShareEmail('');
      setIsShareDialogOpen(false);
      fetchFolderShares();
      toast({
        title: "Success",
        description: `Folder shared with ${trimmedEmail}`,
      });
    } catch (error: any) {
      console.error('Error sharing folder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share folder.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSharePermission = async (shareId: string, newPermission: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update shares.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Updating share permission for:', shareId, 'to:', newPermission);
      const { error } = await supabase
        .from('folder_shares')
        .update({ permission_level: newPermission })
        .eq('id', shareId);

      if (error) {
        console.error('Error updating permission:', error);
        throw error;
      }

      console.log('Permission updated successfully');
      fetchFolderShares();
      toast({
        title: "Success",
        description: "Permission updated successfully.",
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission.",
        variant: "destructive",
      });
    }
  };

  const removeShare = async (shareId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to remove shares.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Removing share:', shareId);
      const { error } = await supabase
        .from('folder_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        console.error('Error removing share:', error);
        throw error;
      }

      console.log('Share removed successfully');
      fetchFolderShares();
      toast({
        title: "Success",
        description: "Share removed successfully.",
      });
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: "Error",
        description: "Failed to remove share.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle className="text-white">Authentication Required</DialogTitle>
            <DialogDescription>
              You must be logged in to manage folder sharing.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="elegant-card max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Manage Folder Sharing - {folderName}
          </DialogTitle>
          <DialogDescription>
            Share this folder with other users via email and manage existing shares.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Folder Shares */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Current Shares</h3>
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="button-elegant">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="elegant-card">
                  <DialogHeader>
                    <DialogTitle className="text-white">Share Folder</DialogTitle>
                    <DialogDescription>
                      Enter the email address of the user you want to share this folder with.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shareEmail" className="text-white">Email Address</Label>
                      <Input
                        id="shareEmail"
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="input-elegant"
                      />
                    </div>
                    <div>
                      <Label htmlFor="permission" className="text-white">Permission Level</Label>
                      <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                        <SelectTrigger className="input-elegant">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View Only</SelectItem>
                          <SelectItem value="edit">Edit Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={shareFolder} 
                      disabled={!shareEmail.trim() || loading}
                      className="button-elegant w-full"
                    >
                      {loading ? 'Sharing...' : 'Share Folder'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shares.length > 0 ? (
                shares.map((share) => (
                  <Card key={share.id} className="elegant-card">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium">{share.shared_with_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Select 
                              value={share.permission_level} 
                              onValueChange={(value) => updateSharePermission(share.id, value)}
                            >
                              <SelectTrigger className="h-6 text-xs w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="view">View</SelectItem>
                                <SelectItem value="edit">Edit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeShare(share.id)}
                          className="h-8 w-8 p-0 border-gray-400 text-gray-400 hover:bg-red-500 hover:border-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No shares for this folder yet.
                </p>
              )}
            </div>
          </div>

          {/* Folders Shared With Me */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Folders Shared With Me</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sharedFolders.length > 0 ? (
                sharedFolders.map((folder) => (
                  <Card key={folder.folder_id} className="elegant-card">
                    <CardContent className="p-3">
                      <div>
                        <p className="text-white font-medium">{folder.folder_name}</p>
                        <p className="text-muted-foreground text-sm">
                          Shared by {folder.shared_by_email || 'Unknown user'}
                        </p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {folder.permission_level} access
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No folders shared with you yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
