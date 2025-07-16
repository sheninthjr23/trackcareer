import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Target, Briefcase, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalResumes: number;
  activeCourses: number;
  upcomingActivities: number;
  activeApplications: number;
}

interface RecentActivity {
  type: string;
  action: string;
  time: string;
  created_at?: string;
}

interface DashboardProps {
  onSectionChange?: (section: 'resumes' | 'courses' | 'activities' | 'jobs') => void;
}

export function Dashboard({ onSectionChange }: DashboardProps = {}) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalResumes: 0,
    activeCourses: 0,
    upcomingActivities: 0,
    activeApplications: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentActivities();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [resumesResult, coursesResult, activitiesResult, jobsResult] = await Promise.all([
        supabase.from('resumes').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('courses').select('id', { count: 'exact' }).eq('user_id', user!.id).neq('status', 'Completed'),
        supabase.from('activities').select('id', { count: 'exact' }).eq('user_id', user!.id).gte('predicted_end_date', new Date().toISOString().split('T')[0]).neq('status', 'Completed'),
        supabase.from('job_applications').select('id', { count: 'exact' }).eq('user_id', user!.id).in('status', ['In Progress', 'Shortlisted'])
      ]);

      setStats({
        totalResumes: resumesResult.count || 0,
        activeCourses: coursesResult.count || 0,
        upcomingActivities: activitiesResult.count || 0,
        activeApplications: jobsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities: RecentActivity[] = [];
      
      // Fetch recent resumes
      const { data: resumes } = await supabase
        .from('resumes')
        .select('custom_name, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (resumes) {
        resumes.forEach(resume => {
          activities.push({
            type: 'Resume',
            action: `Uploaded ${resume.custom_name}`,
            time: formatTimeAgo(resume.created_at),
            created_at: resume.created_at
          });
        });
      }

      // Fetch recent courses - using correct column names
      const { data: courses } = await supabase
        .from('courses')
        .select('title, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (courses) {
        courses.forEach(course => {
          activities.push({
            type: 'Course',
            action: `Started ${course.title}`,
            time: formatTimeAgo(course.created_at),
            created_at: course.created_at
          });
        });
      }

      // Fetch recent job applications - using correct column names
      const { data: jobs } = await supabase
        .from('job_applications')
        .select('company_name, role, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (jobs) {
        jobs.forEach(job => {
          activities.push({
            type: 'Job',
            action: `Applied to ${job.company_name} - ${job.role}`,
            time: formatTimeAgo(job.created_at),
            created_at: job.created_at
          });
        });
      }

      // Sort all activities by creation date and take the most recent 4
      const sortedActivities = activities
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, 4);

      setRecentActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handleQuickAction = (section: 'resumes' | 'courses' | 'activities' | 'jobs') => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const statsConfig = [
    {
      title: "Total Resumes",
      value: stats.totalResumes,
      icon: FileText,
      description: "Uploaded documents",
      color: "text-blue-500",
    },
    {
      title: "Active Courses",
      value: stats.activeCourses,
      icon: BookOpen,
      description: "Currently learning",
      color: "text-green-500",
    },
    {
      title: "Upcoming Activities",
      value: stats.upcomingActivities,
      icon: Target,
      description: "Tasks to complete",
      color: "text-yellow-500",
    },
    {
      title: "Active Applications",
      value: stats.activeApplications,
      icon: Briefcase,
      description: "Job opportunities",
      color: "text-primary",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's an overview of your career development journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions across all sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                        <span className="text-sm font-medium">{activity.action}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activities found. Start by uploading a resume or adding a course!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks to keep you productive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                onClick={() => handleQuickAction('resumes')}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium">Upload new resume</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div 
                onClick={() => handleQuickAction('courses')}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium">Add new course</span>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div 
                onClick={() => handleQuickAction('activities')}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium">Track new activity</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div 
                onClick={() => handleQuickAction('jobs')}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium">Log job application</span>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
