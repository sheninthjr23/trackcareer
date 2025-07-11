
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ExternalLink, Github, Edit, Trash2, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DSATopicSelect } from './DSATopicSelect';

interface DSAProblem {
  id: string;
  title: string;
  problem_link: string | null;
  topic: string;
  level: 'Easy' | 'Medium' | 'Hard';
  github_solution_link: string | null;
  youtube_link: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  folder_id: string;
  code_solutions: any[];
  is_live_problem: boolean;
  live_added_at: string | null;
}

interface DSAProblemsViewProps {
  folderId?: string;
}

export const DSAProblemsView: React.FC<DSAProblemsViewProps> = ({ folderId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<DSAProblem | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    problem_link: '',
    topic: '',
    level: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    github_solution_link: '',
    youtube_link: '',
  });

  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['dsa-problems', folderId],
    queryFn: async () => {
      let query = supabase
        .from('dsa_problems')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DSAProblem[];
    },
    enabled: !folderId || !!folderId,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['dsa-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_folders')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createProblemMutation = useMutation({
    mutationFn: async (problemData: typeof formData) => {
      if (!folderId && !editingProblem) {
        throw new Error('Folder ID is required for new problems');
      }

      const { data, error } = await supabase
        .from('dsa_problems')
        .insert({
          ...problemData,
          folder_id: folderId || editingProblem?.folder_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          code_solutions: [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-practice-problems'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Problem added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding problem', description: error.message, variant: 'destructive' });
    },
  });

  const updateProblemMutation = useMutation({
    mutationFn: async ({ id, ...problemData }: typeof formData & { id: string }) => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .update(problemData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-practice-problems'] });
      setIsDialogOpen(false);
      setEditingProblem(null);
      resetForm();
      toast({ title: 'Problem updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating problem', description: error.message, variant: 'destructive' });
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .update({ 
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-live-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-practice-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-weekly-activity'] });
      toast({ title: 'Problem status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dsa_problems')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-practice-problems'] });
      toast({ title: 'Problem deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting problem', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      problem_link: '',
      topic: '',
      level: 'Easy',
      github_solution_link: '',
      youtube_link: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProblem) {
      updateProblemMutation.mutate({ ...formData, id: editingProblem.id });
    } else {
      createProblemMutation.mutate(formData);
    }
  };

  const startEdit = (problem: DSAProblem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      problem_link: problem.problem_link || '',
      topic: problem.topic,
      level: problem.level,
      github_solution_link: problem.github_solution_link || '',
      youtube_link: problem.youtube_link || '',
    });
    setIsDialogOpen(true);
  };

  const filteredProblems = problems.filter(problem => {
    if (filterLevel !== 'all' && problem.level !== filterLevel) return false;
    if (filterTopic !== 'all' && problem.topic !== filterTopic) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed' && !problem.is_completed) return false;
      if (filterStatus === 'pending' && problem.is_completed) return false;
    }
    return true;
  });

  const uniqueTopics = Array.from(new Set(problems.map(p => p.topic))).sort();

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Easy': return 'default';
      case 'Medium': return 'secondary';
      case 'Hard': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <div>Loading problems...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTopic} onValueChange={setFilterTopic}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {uniqueTopics.map(topic => (
                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingProblem(null);
                resetForm();
              }}
              disabled={!folderId && !editingProblem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Problem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProblem ? 'Edit Problem' : 'Add New Problem'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Problem Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Two Sum, Binary Search, etc."
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Topic</label>
                  <DSATopicSelect
                    value={formData.topic}
                    onValueChange={(value) => setFormData({ ...formData, topic: value })}
                    placeholder="Select or type topic"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value as 'Easy' | 'Medium' | 'Hard' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Problem Link</label>
                  <Input
                    value={formData.problem_link}
                    onChange={(e) => setFormData({ ...formData, problem_link: e.target.value })}
                    placeholder="https://leetcode.com/problems/..."
                    type="url"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">GitHub Solution Link</label>
                  <Input
                    value={formData.github_solution_link}
                    onChange={(e) => setFormData({ ...formData, github_solution_link: e.target.value })}
                    placeholder="https://github.com/..."
                    type="url"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">YouTube Video Link</label>
                  <Input
                    value={formData.youtube_link}
                    onChange={(e) => setFormData({ ...formData, youtube_link: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    type="url"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProblem ? 'Update' : 'Add'} Problem
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Done</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Links</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProblems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {folderId ? 'No problems in this folder yet.' : 'No problems found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProblems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>
                    <Checkbox
                      checked={problem.is_completed}
                      onCheckedChange={(checked) =>
                        toggleCompletionMutation.mutate({
                          id: problem.id,
                          is_completed: !!checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {problem.title}
                  </TableCell>
                  <TableCell>{problem.topic}</TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(problem.level)}>
                      {problem.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {problem.problem_link && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={problem.problem_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {problem.github_solution_link && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={problem.github_solution_link} target="_blank" rel="noopener noreferrer">
                            <Github className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {problem.youtube_link && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={problem.youtube_link} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {problem.completed_at ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(problem.completed_at), 'MMM dd, yyyy')}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not completed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(problem)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProblemMutation.mutate(problem.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredProblems.length} of {problems.length} problems
        {filteredProblems.length > 0 && (
          <span className="ml-4">
            Completed: {filteredProblems.filter(p => p.is_completed).length} | 
            Pending: {filteredProblems.filter(p => !p.is_completed).length}
          </span>
        )}
      </div>
    </div>
  );
};
