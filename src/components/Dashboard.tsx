
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Target, Briefcase, TrendingUp, Calendar } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function Dashboard() {
  const [resumes] = useLocalStorage('resumes', []);
  const [courses] = useLocalStorage('courses', []);
  const [activities] = useLocalStorage('activities', []);
  const [jobApplications] = useLocalStorage('jobApplications', []);

  // Calculate stats
  const activeJobs = jobApplications.filter((job: any) => 
    job.status === 'In Progress' || job.status === 'Shortlisted'
  ).length;
  
  const completedCourses = courses.filter((course: any) => 
    course.status === 'Completed'
  ).length;
  
  const upcomingActivities = activities.filter((activity: any) => {
    const endDate = new Date(activity.predictedEndDate);
    const today = new Date();
    return endDate > today && activity.status !== 'Completed';
  }).length;

  const stats = [
    {
      title: "Total Resumes",
      value: resumes.length,
      icon: FileText,
      description: "Uploaded documents",
      color: "text-blue-500",
    },
    {
      title: "Active Courses",
      value: courses.length - completedCourses,
      icon: BookOpen,
      description: "Currently learning",
      color: "text-green-500",
    },
    {
      title: "Upcoming Activities",
      value: upcomingActivities,
      icon: Target,
      description: "Tasks to complete",
      color: "text-yellow-500",
    },
    {
      title: "Active Applications",
      value: activeJobs,
      icon: Briefcase,
      description: "Job opportunities",
      color: "text-primary",
    },
  ];

  const recentActivities = [
    { type: "Course", action: "Started React Advanced Patterns", time: "2 hours ago" },
    { type: "Job", action: "Applied to Tech Corp - Senior Developer", time: "1 day ago" },
    { type: "Resume", action: "Uploaded new resume version", time: "2 days ago" },
    { type: "Activity", action: "Completed System Design study", time: "3 days ago" },
  ];

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
        {stats.map((stat) => {
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
              {recentActivities.map((activity, index) => (
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
              ))}
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                <span className="text-sm font-medium">Upload new resume</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                <span className="text-sm font-medium">Add new course</span>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                <span className="text-sm font-medium">Track new activity</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
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
