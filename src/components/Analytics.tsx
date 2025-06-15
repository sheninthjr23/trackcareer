
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, Target, Award, Activity, BarChart3, FileText, BookOpen, CheckCircle, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScoreBreakdownDialog } from "./ScoreBreakdownDialog";

type TimeFilter = 'day' | 'week' | 'month' | 'year';
type ScoreType = 'completion' | 'productivity' | 'active' | 'total';

interface AnalyticsData {
  totalResumes: number;
  totalCourses: number;
  totalActivities: number;
  totalJobApplications: number;
  completedActivities: number;
  activeApplications: number;
  completedCourses: number;
  recentUploads: number;
}

interface ChartData {
  name: string;
  value: number;
  date?: string;
}

const chartConfig = {
  resumes: { label: "Resumes", color: "#3b82f6" },
  courses: { label: "Courses", color: "#10b981" },
  activities: { label: "Activities", color: "#f59e0b" },
  jobs: { label: "Job Applications", color: "#8b5cf6" },
};

export function Analytics() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalResumes: 0,
    totalCourses: 0,
    totalActivities: 0,
    totalJobApplications: 0,
    completedActivities: 0,
    activeApplications: 0,
    completedCourses: 0,
    recentUploads: 0,
  });
  const [activityTrend, setActivityTrend] = useState<ChartData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<ChartData[]>([]);
  const [progressOverTime, setProgressOverTime] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScoreType, setSelectedScoreType] = useState<ScoreType>('completion');

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeFilter]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeFilter) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Fetch all data in parallel
      const [resumesResult, coursesResult, activitiesResult, jobsResult] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user!.id),
        supabase.from('courses').select('*').eq('user_id', user!.id),
        supabase.from('activities').select('*').eq('user_id', user!.id),
        supabase.from('job_applications').select('*').eq('user_id', user!.id)
      ]);

      const resumes = resumesResult.data || [];
      const courses = coursesResult.data || [];
      const activities = activitiesResult.data || [];
      const jobApplications = jobsResult.data || [];

      // Filter by time period
      const filteredResumes = resumes.filter(item => new Date(item.created_at) >= dateFilter);
      const filteredCourses = courses.filter(item => new Date(item.created_at) >= dateFilter);
      const filteredActivities = activities.filter(item => new Date(item.created_at) >= dateFilter);
      const filteredJobs = jobApplications.filter(item => new Date(item.created_at) >= dateFilter);

      // Calculate analytics
      const data: AnalyticsData = {
        totalResumes: filteredResumes.length,
        totalCourses: filteredCourses.length,
        totalActivities: filteredActivities.length,
        totalJobApplications: filteredJobs.length,
        completedActivities: filteredActivities.filter(a => a.status === 'Completed').length,
        activeApplications: filteredJobs.filter(j => ['In Progress', 'Shortlisted'].includes(j.status)).length,
        completedCourses: filteredCourses.filter(c => c.status === 'Completed').length,
        recentUploads: filteredResumes.length,
      };

      setAnalyticsData(data);

      // Prepare chart data
      const categoryData: ChartData[] = [
        { name: 'Resumes', value: data.totalResumes },
        { name: 'Courses', value: data.totalCourses },
        { name: 'Activities', value: data.totalActivities },
        { name: 'Job Apps', value: data.totalJobApplications },
      ];
      setCategoryDistribution(categoryData);

      // Generate trend data
      generateTrendData(filteredResumes, filteredCourses, filteredActivities, filteredJobs);
      generateProgressData(activities, courses);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (resumes: any[], courses: any[], activities: any[], jobs: any[]) => {
    const allItems = [
      ...resumes.map(r => ({ ...r, type: 'Resume' })),
      ...courses.map(c => ({ ...c, type: 'Course' })),
      ...activities.map(a => ({ ...a, type: 'Activity' })),
      ...jobs.map(j => ({ ...j, type: 'Job' }))
    ];

    // Group by date and count
    const dateGroups: { [key: string]: number } = {};
    allItems.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    const trendData = Object.entries(dateGroups)
      .map(([date, count]) => ({ name: date, value: count }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-10); // Last 10 data points

    setActivityTrend(trendData);
  };

  const generateProgressData = (activities: any[], courses: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toLocaleDateString();
    }).reverse();

    const progressData = last7Days.map(date => {
      const dayActivities = activities.filter(a => 
        new Date(a.created_at).toLocaleDateString() === date
      );
      const dayCourses = courses.filter(c => 
        new Date(c.created_at).toLocaleDateString() === date
      );
      
      const completed = dayActivities.filter(a => a.status === 'Completed').length + 
                       dayCourses.filter(c => c.status === 'Completed').length;
      
      return { name: date, value: completed };
    });

    setProgressOverTime(progressData);
  };

  const calculateCompletionRate = () => {
    const totalTasks = analyticsData.totalActivities + analyticsData.totalCourses;
    const completedTasks = analyticsData.completedActivities + analyticsData.completedCourses;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const calculateProductivityScore = () => {
    const weights = {
      resumes: 20,
      courses: 25,
      activities: 30,
      jobs: 25
    };
    
    const score = (
      (analyticsData.totalResumes * weights.resumes) +
      (analyticsData.completedCourses * weights.courses) +
      (analyticsData.completedActivities * weights.activities) +
      (analyticsData.activeApplications * weights.jobs)
    );
    
    return Math.min(Math.round(score / 10), 100);
  };

  const handleScoreClick = (scoreType: ScoreType) => {
    setSelectedScoreType(scoreType);
    setDialogOpen(true);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your progress and productivity metrics</p>
        </div>
        <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="elegant-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleScoreClick('completion')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{calculateCompletionRate()}%</div>
            <Progress value={calculateCompletionRate()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Click for details</p>
          </CardContent>
        </Card>

        <Card 
          className="elegant-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleScoreClick('productivity')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{calculateProductivityScore()}</div>
            <Progress value={calculateProductivityScore()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Click for details</p>
          </CardContent>
        </Card>

        <Card 
          className="elegant-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleScoreClick('active')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">
              {analyticsData.totalActivities + analyticsData.totalCourses - analyticsData.completedActivities - analyticsData.completedCourses}
            </div>
            <p className="text-xs text-muted-foreground">Items in progress</p>
            <p className="text-xs text-muted-foreground mt-1">Click for details</p>
          </CardContent>
        </Card>

        <Card 
          className="elegant-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleScoreClick('total')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">
              {analyticsData.totalResumes + analyticsData.totalCourses + analyticsData.totalActivities + analyticsData.totalJobApplications}
            </div>
            <p className="text-xs text-muted-foreground">All time items</p>
            <p className="text-xs text-muted-foreground mt-1">Click for details</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Trend */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-gradient">Activity Trend</CardTitle>
            <CardDescription>Your activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    fontSize={11}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-gradient">Category Distribution</CardTitle>
            <CardDescription>Breakdown by activity type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Progress Over Time - Improved */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-gradient">Completion Progress</CardTitle>
            <CardDescription>Daily completion trend (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    fontSize={10}
                    tickMargin={8}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Summary Stats - Completely redesigned */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-gradient">Summary Statistics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500 text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Resumes Uploaded</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Document management</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analyticsData.totalResumes}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500 text-white">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Courses Completed</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Learning progress</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{analyticsData.completedCourses}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500 text-white">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Activities Done</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">Task completion</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analyticsData.completedActivities}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500 text-white">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Active Applications</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Job search progress</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analyticsData.activeApplications}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown Dialog */}
      <ScoreBreakdownDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        scoreType={selectedScoreType}
        analyticsData={analyticsData}
      />
    </div>
  );
}
