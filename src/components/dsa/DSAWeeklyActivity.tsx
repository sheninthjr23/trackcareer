
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';

interface DSAProblem {
  id: string;
  title: string;
  topic: string;
  level: 'Easy' | 'Medium' | 'Hard';
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export const DSAWeeklyActivity = () => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weeklyProblems = [], isLoading } = useQuery({
    queryKey: ['dsa-weekly-activity', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('*')
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString())
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as DSAProblem[];
    },
  });

  const { data: totalStats } = useQuery({
    queryKey: ['dsa-total-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('id, is_completed, level')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const total = data.length;
      const completed = data.filter(p => p.is_completed).length;
      const byLevel = data.reduce((acc, problem) => {
        acc[problem.level] = (acc[problem.level] || 0) + 1;
        if (problem.is_completed) {
          acc[`completed_${problem.level}`] = (acc[`completed_${problem.level}`] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      return { total, completed, byLevel };
    },
  });

  const getProblemsByDay = (date: Date) => {
    return weeklyProblems.filter(problem => 
      problem.completed_at && isSameDay(new Date(problem.completed_at), date)
    );
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Easy': return 'default';
      case 'Medium': return 'secondary';
      case 'Hard': return 'destructive';
      default: return 'default';
    }
  };

  const thisWeekCount = weeklyProblems.length;
  const todayCount = getProblemsByDay(now).length;

  if (isLoading) {
    return <div>Loading weekly activity...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">Problems completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekCount}</div>
            <p className="text-xs text-muted-foreground">Problems completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {totalStats?.total || 0} problems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats?.total ? Math.round((totalStats.completed / totalStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayProblems = getProblemsByDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`p-4 rounded-lg border min-h-32 ${
                    isCurrentDay ? 'bg-primary/5 border-primary/20' : 'bg-muted/20'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'dd')}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {dayProblems.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        No problems
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-medium text-center mb-2">
                          {dayProblems.length} solved
                        </div>
                        {dayProblems.slice(0, 3).map((problem) => (
                          <div
                            key={problem.id}
                            className="text-xs p-1 bg-background rounded border"
                          >
                            <div className="truncate" title={problem.title}>
                              {problem.title}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <Badge 
                                variant={getLevelBadgeVariant(problem.level)}
                                className="text-xs py-0 px-1"
                              >
                                {problem.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {problem.topic}
                              </span>
                            </div>
                          </div>
                        ))}
                        {dayProblems.length > 3 && (
                          <div className="text-xs text-center text-muted-foreground">
                            +{dayProblems.length - 3} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {totalStats && (
        <Card>
          <CardHeader>
            <CardTitle>Progress by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {['Easy', 'Medium', 'Hard'].map((level) => {
                const total = totalStats.byLevel[level] || 0;
                const completed = totalStats.byLevel[`completed_${level}`] || 0;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return (
                  <div key={level} className="text-center p-4 rounded-lg border">
                    <Badge variant={getLevelBadgeVariant(level)} className="mb-2">
                      {level}
                    </Badge>
                    <div className="text-2xl font-bold">{completed}/{total}</div>
                    <div className="text-sm text-muted-foreground">{percentage}% complete</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          level === 'Easy' ? 'bg-green-500' :
                          level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
