
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Github, Calendar, Target, CheckCircle, Youtube, Code, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DSACodeSolutions } from './DSACodeSolutions';

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
  live_todo_completed: boolean | null;
  live_todo_completed_at: string | null;
}

export const DSALiveSection = () => {
  const [selectedProblem, setSelectedProblem] = useState<DSAProblem | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  // Query for live completed todos
  const { data: liveCompletedTodos = [], isLoading } = useQuery({
    queryKey: ['dsa-live-completed-todos', sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('id, title, problem_link, topic, level, github_solution_link, youtube_link, is_completed, completed_at, created_at, folder_id, code_solutions, is_live_problem, live_added_at, user_id, updated_at, live_todo_completed, live_todo_completed_at')
        .eq('live_todo_completed', true)
        .not('live_todo_completed_at', 'is', null)
        .order('live_todo_completed_at', { ascending: sortOrder === 'asc' });
      
      if (error) throw error;
      return data as DSAProblem[];
    },
  });

  // Query for live uncompleted todos (problems that were completed this week but not yet done in live section)
  const { data: liveUncompletedTodos = [] } = useQuery({
    queryKey: ['dsa-live-uncompleted-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('id, title, problem_link, topic, level, github_solution_link, youtube_link, is_completed, completed_at, created_at, folder_id, code_solutions, is_live_problem, live_added_at, user_id, updated_at, live_todo_completed, live_todo_completed_at')
        .eq('is_completed', true)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString())
        .or('live_todo_completed.is.null,live_todo_completed.eq.false')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as DSAProblem[];
    },
  });

  const toggleLiveTodoMutation = useMutation({
    mutationFn: async ({ id, live_todo_completed }: { id: string; live_todo_completed: boolean }) => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .update({ 
          live_todo_completed,
          live_todo_completed_at: live_todo_completed ? new Date().toISOString() : null 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-live-completed-todos'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-live-uncompleted-todos'] });
      toast({ title: 'Live todo updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating live todo', description: error.message, variant: 'destructive' });
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
      queryClient.invalidateQueries({ queryKey: ['dsa-live-completed-todos'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-live-uncompleted-todos'] });
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

  // Filter problems
  const filteredLiveCompletedTodos = liveCompletedTodos.filter(problem => {
    if (filterLevel !== 'all' && problem.level !== filterLevel) return false;
    if (filterTopic !== 'all' && problem.topic !== filterTopic) return false;
    return true;
  });

  const filteredLiveUncompletedTodos = liveUncompletedTodos.filter(problem => {
    if (filterLevel !== 'all' && problem.level !== filterLevel) return false;
    if (filterTopic !== 'all' && problem.topic !== filterTopic) return false;
    return true;
  });

  // Get unique topics for filtering
  const allProblems = [...liveCompletedTodos, ...liveUncompletedTodos];
  const uniqueTopics = Array.from(new Set(allProblems.map(p => p.topic))).sort();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Live Section - This Week's Progress
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
            Live Section - This Week's Progress
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')} • 
            {filteredLiveCompletedTodos.length} live todos completed, {filteredLiveUncompletedTodos.length} pending
          </p>
          
          {/* Filters */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
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

            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Latest First</SelectItem>
                <SelectItem value="asc">Earliest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Completed Todos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Live Todos Completed ({filteredLiveCompletedTodos.length})
            </h3>
            {filteredLiveCompletedTodos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No live todos completed yet.</p>
                <p className="text-sm">Complete some problems below to see them here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLiveCompletedTodos.map((problem) => (
                  <Card 
                    key={problem.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary bg-primary/5"
                    onClick={() => setSelectedProblem(problem)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-2">{problem.title}</h4>
                          <Checkbox
                            checked={true}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                toggleLiveTodoMutation.mutate({
                                  id: problem.id,
                                  live_todo_completed: false,
                                });
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelBadgeVariant(problem.level)} className="text-xs">
                            {problem.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{problem.topic}</span>
                        </div>
                        {problem.live_todo_completed_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(problem.live_todo_completed_at), 'MMM dd, HH:mm')}
                          </div>
                        )}
                        <div className="flex gap-1 flex-wrap">
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
                          {problem.youtube_link && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(problem.youtube_link!, '_blank');
                              }}
                            >
                              <Youtube className="h-3 w-3" />
                            </Button>
                          )}
                          {problem.code_solutions && problem.code_solutions.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Code className="h-3 w-3" />
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

          {/* Live Uncompleted Todos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Live Todos Pending ({filteredLiveUncompletedTodos.length})
            </h3>
            {filteredLiveUncompletedTodos.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No pending live todos. Complete more problems this week to see them here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLiveUncompletedTodos.map((problem) => (
                  <Card 
                    key={problem.id} 
                    className="border-l-4 border-l-muted-foreground cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedProblem(problem)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-2">{problem.title}</h4>
                          <Checkbox
                            checked={false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                toggleLiveTodoMutation.mutate({
                                  id: problem.id,
                                  live_todo_completed: true,
                                });
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
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
                            Solved: {format(new Date(problem.completed_at), 'MMM dd, HH:mm')}
                          </div>
                        )}
                        <div className="flex gap-1 flex-wrap">
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
                          {problem.youtube_link && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(problem.youtube_link!, '_blank');
                              }}
                            >
                              <Youtube className="h-3 w-3" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Problem Details
            </DialogTitle>
          </DialogHeader>
          {selectedProblem && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedProblem.title}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={getLevelBadgeVariant(selectedProblem.level)}>
                    {selectedProblem.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Topic: {selectedProblem.topic}</span>
                  <span className="text-sm text-muted-foreground">
                    Status: {selectedProblem.is_completed ? 'Completed' : 'Pending'} | 
                    Live Todo: {selectedProblem.live_todo_completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              </div>
              
              {selectedProblem.completed_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Completed on {format(new Date(selectedProblem.completed_at), 'MMM dd, yyyy at HH:mm')}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
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
                {selectedProblem.youtube_link && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(selectedProblem.youtube_link!, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Youtube className="h-4 w-4" />
                    Watch Video
                  </Button>
                )}
                <Button
                  variant={selectedProblem.live_todo_completed ? "destructive" : "default"}
                  onClick={() => {
                    toggleLiveTodoMutation.mutate({
                      id: selectedProblem.id,
                      live_todo_completed: !selectedProblem.live_todo_completed,
                    });
                    setSelectedProblem(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {selectedProblem.live_todo_completed ? 'Mark Undone' : 'Mark Done'}
                </Button>
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
                  <CheckCircle className="h-4 w-4" />
                  {selectedProblem.is_completed ? 'Redo Problem' : 'Complete Problem'}
                </Button>
              </div>

              {/* Code Solutions Section */}
              <DSACodeSolutions 
                problemId={selectedProblem.id}
                codeSolutions={selectedProblem.code_solutions || []}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
