
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

interface DSAProblem {
  id: string;
  title: string;
  topic: string;
  level: 'Easy' | 'Medium' | 'Hard';
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export const DSAAnalytics = () => {
  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['dsa-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DSAProblem[];
    },
  });

  // Generate data for charts
  const getTopicDistribution = () => {
    const topicCount = problems.reduce((acc, problem) => {
      acc[problem.topic] = (acc[problem.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCount)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getCompletionByTopic = () => {
    const topicStats = problems.reduce((acc, problem) => {
      if (!acc[problem.topic]) {
        acc[problem.topic] = { total: 0, completed: 0 };
      }
      acc[problem.topic].total += 1;
      if (problem.is_completed) {
        acc[problem.topic].completed += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        total: stats.total,
        completed: stats.completed,
        percentage: Math.round((stats.completed / stats.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  };

  const getDifficultyDistribution = () => {
    const levels = ['Easy', 'Medium', 'Hard'];
    return levels.map(level => {
      const total = problems.filter(p => p.level === level).length;
      const completed = problems.filter(p => p.level === level && p.is_completed).length;
      return {
        level,
        total,
        completed,
        pending: total - completed,
      };
    });
  };

  const getMonthlyProgress = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(date => {
      const completedOnDay = problems.filter(problem => 
        problem.completed_at && isSameDay(new Date(problem.completed_at), date)
      ).length;

      return {
        date: format(date, 'MMM dd'),
        completed: completedOnDay,
      };
    });
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  const topicDistribution = getTopicDistribution();
  const completionByTopic = getCompletionByTopic();
  const difficultyDistribution = getDifficultyDistribution();
  const monthlyProgress = getMonthlyProgress();

  const totalProblems = problems.length;
  const completedProblems = problems.filter(p => p.is_completed).length;
  const completionRate = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProblems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedProblems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Problems by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="topic" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={difficultyDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                  label={({ level, total }) => `${level}: ${total}`}
                >
                  {difficultyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionByTopic}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="topic" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                <Bar dataKey="total" fill="#8884d8" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>30-Day Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {difficultyDistribution.map((level) => (
              <div key={level.level} className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{level.level}</h3>
                <div className="text-2xl font-bold mb-1">
                  {level.completed}/{level.total}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {level.total > 0 ? Math.round((level.completed / level.total) * 100) : 0}% Complete
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      level.level === 'Easy' ? 'bg-green-500' :
                      level.level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${level.total > 0 ? (level.completed / level.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
