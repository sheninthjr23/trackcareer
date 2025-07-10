
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Github, Calendar, Target, CheckCircle, RotateCcw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isThisWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DSAProblem {
  id: string;
  title: string;
  problem_link: string | null;
  topic: string;
  level: 'Easy' | 'Medium' | 'Hard';
  github_solution_link: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  folder_id: string;
}

export const DSALiveSection = () => {
  const [selectedProblem, setSelectedProblem] = useState<DSAProblem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  // Get problems completed this week (sorted by completion time - earliest first)
  const { data: completedProblems = [], isLoading } = useQuery({
    queryKey: ['dsa-live-completed', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('*')
        .eq('is_completed', true)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString())
        .order('completed_at', { ascending: true }); // Earliest first
      
      if (error) throw error;
      return data as DSAProblem[];
    },
  });

  // Get problems that need revision/redo (recently completed problems that might need practice)
  const { data: revisionProblems = [] } = useQuery({
    queryKey: ['dsa-live-revision'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('*')
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as DSAProblem[];
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
      queryClient.invalidateQueries({ queryKey: ['dsa-live-completed'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-live-revision'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-weekly-activity'] });
      toast({ title: 'Problem status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    },
  });

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Easy': return 'default';
      case 'Medium': return 'secondary';
      case 'Hard': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Live Section - This Week's Practice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading this week's problems...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Live Section - This Week's Practice
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')} • Focus on problems to redo and revise
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Problems for Revision/Redo */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              Problems to Practice ({revisionProblems.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Focus on these problems for revision and practice this week
            </p>
            {revisionProblems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No problems pending for practice.</p>
                <p className="text-sm">Add some problems to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {revisionProblems.map((problem) => (
                  <Card 
                    key={problem.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                    onClick={() => setSelectedProblem(problem)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-2">{problem.title}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs shrink-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompletionMutation.mutate({
                                id: problem.id,
                                is_completed: true,
                              });
                            }}
                          >
                            Complete
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelBadgeVariant(problem.level)} className="text-xs">
                            {problem.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{problem.topic}</span>
                        </div>
                        <div className="flex gap-1">
                          {problem.problem_link && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(problem.problem_link!, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {problem.github_solution_link && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(problem.github_solution_link!, '_blank');
                              }}
                            >
                              <Github className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Problems This Week */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Completed This Week ({completedProblems.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Problems you've completed this week (sorted by completion time)
            </p>
            {completedProblems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No problems completed this week yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedProblems.map((problem) => (
                  <Card 
                    key={problem.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500 bg-green-50/50"
                    onClick={() => setSelectedProblem(problem)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-2">{problem.title}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs shrink-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompletionMutation.mutate({
                                id: problem.id,
                                is_completed: false,
                              });
                            }}
                          >
                            Redo
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelBadgeVariant(problem.level)} className="text-xs">
                            {problem.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{problem.topic}</span>
                        </div>
                        {problem.completed_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(problem.completed_at), 'MMM dd, HH:mm')}
                          </div>
                        )}
                        <div className="flex gap-1">
                          {problem.problem_link && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(problem.problem_link!, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {problem.github_solution_link && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(problem.github_solution_link!, '_blank');
                              }}
                            >
                              <Github className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Problem Details Dialog */}
      <Dialog open={!!selectedProblem} onOpenChange={() => setSelectedProblem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Problem Details
            </DialogTitle>
          </DialogHeader>
          {selectedProblem && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedProblem.title}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={getLevelBadgeVariant(selectedProblem.level)}>
                    {selectedProblem.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Topic: {selectedProblem.topic}</span>
                  <span className="text-sm text-muted-foreground">
                    Status: {selectedProblem.is_completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
              
              {selectedProblem.completed_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Completed on {format(new Date(selectedProblem.completed_at), 'MMM dd, yyyy at HH:mm')}
                </div>
              )}

              <div className="flex gap-3">
                {selectedProblem.problem_link && (
                  <Button 
                    onClick={() => window.open(selectedProblem.problem_link!, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Problem
                  </Button>
                )}
                {selectedProblem.github_solution_link && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(selectedProblem.github_solution_link!, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    View Solution
                  </Button>
                )}
                <Button
                  variant={selectedProblem.is_completed ? "destructive" : "default"}
                  onClick={() => {
                    toggleCompletionMutation.mutate({
                      id: selectedProblem.id,
                      is_completed: !selectedProblem.is_completed,
                    });
                    setSelectedProblem(null);
                  }}
                  className="flex items-center gap-2"
                >
                  {selectedProblem.is_completed ? <RotateCcw className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {selectedProblem.is_completed ? 'Mark for Redo' : 'Mark as Completed'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
