
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calculator, Target, TrendingUp, Activity, BarChart3 } from "lucide-react";

interface ScoreBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreType: 'completion' | 'productivity' | 'active' | 'total';
  analyticsData: {
    totalResumes: number;
    totalCourses: number;
    totalActivities: number;
    totalJobApplications: number;
    completedActivities: number;
    activeApplications: number;
    completedCourses: number;
    recentUploads: number;
  };
}

export function ScoreBreakdownDialog({ open, onOpenChange, scoreType, analyticsData }: ScoreBreakdownDialogProps) {
  const getScoreDetails = () => {
    switch (scoreType) {
      case 'completion':
        const totalTasks = analyticsData.totalActivities + analyticsData.totalCourses;
        const completedTasks = analyticsData.completedActivities + analyticsData.completedCourses;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          title: "Completion Rate Calculation",
          icon: Target,
          score: `${completionRate}%`,
          description: "This score represents how many of your tasks and courses you've completed",
          breakdown: [
            {
              label: "Completed Activities",
              value: analyticsData.completedActivities,
              total: analyticsData.totalActivities,
              percentage: analyticsData.totalActivities > 0 ? Math.round((analyticsData.completedActivities / analyticsData.totalActivities) * 100) : 0
            },
            {
              label: "Completed Courses",
              value: analyticsData.completedCourses,
              total: analyticsData.totalCourses,
              percentage: analyticsData.totalCourses > 0 ? Math.round((analyticsData.completedCourses / analyticsData.totalCourses) * 100) : 0
            }
          ],
          formula: `(${completedTasks} completed) ÷ (${totalTasks} total) × 100 = ${completionRate}%`
        };

      case 'productivity':
        const weights = { resumes: 20, courses: 25, activities: 30, jobs: 25 };
        const score = Math.min(Math.round((
          (analyticsData.totalResumes * weights.resumes) +
          (analyticsData.completedCourses * weights.courses) +
          (analyticsData.completedActivities * weights.activities) +
          (analyticsData.activeApplications * weights.jobs)
        ) / 10), 100);
        
        return {
          title: "Productivity Score Calculation",
          icon: TrendingUp,
          score: score.toString(),
          description: "A weighted score based on your activity across all categories",
          breakdown: [
            {
              label: "Resume Uploads",
              value: analyticsData.totalResumes,
              weight: weights.resumes,
              contribution: analyticsData.totalResumes * weights.resumes
            },
            {
              label: "Completed Courses",
              value: analyticsData.completedCourses,
              weight: weights.courses,
              contribution: analyticsData.completedCourses * weights.courses
            },
            {
              label: "Completed Activities",
              value: analyticsData.completedActivities,
              weight: weights.activities,
              contribution: analyticsData.completedActivities * weights.activities
            },
            {
              label: "Active Job Applications",
              value: analyticsData.activeApplications,
              weight: weights.jobs,
              contribution: analyticsData.activeApplications * weights.jobs
            }
          ],
          formula: `Total weighted score ÷ 10 = ${score} (capped at 100)`
        };

      case 'active':
        const activeItems = analyticsData.totalActivities + analyticsData.totalCourses - analyticsData.completedActivities - analyticsData.completedCourses;
        
        return {
          title: "Active Items Calculation",
          icon: Activity,
          score: activeItems.toString(),
          description: "Items currently in progress across activities and courses",
          breakdown: [
            {
              label: "Total Activities",
              value: analyticsData.totalActivities,
              status: "created"
            },
            {
              label: "Completed Activities",
              value: analyticsData.completedActivities,
              status: "completed"
            },
            {
              label: "Active Activities",
              value: analyticsData.totalActivities - analyticsData.completedActivities,
              status: "active"
            },
            {
              label: "Total Courses",
              value: analyticsData.totalCourses,
              status: "created"
            },
            {
              label: "Completed Courses",
              value: analyticsData.completedCourses,
              status: "completed"
            },
            {
              label: "Active Courses",
              value: analyticsData.totalCourses - analyticsData.completedCourses,
              status: "active"
            }
          ],
          formula: `(${analyticsData.totalActivities + analyticsData.totalCourses} total) - (${analyticsData.completedActivities + analyticsData.completedCourses} completed) = ${activeItems} active`
        };

      case 'total':
        const totalActivity = analyticsData.totalResumes + analyticsData.totalCourses + analyticsData.totalActivities + analyticsData.totalJobApplications;
        
        return {
          title: "Total Activity Calculation",
          icon: BarChart3,
          score: totalActivity.toString(),
          description: "Sum of all items across all categories",
          breakdown: [
            {
              label: "Resumes",
              value: analyticsData.totalResumes,
              category: "files"
            },
            {
              label: "Courses",
              value: analyticsData.totalCourses,
              category: "learning"
            },
            {
              label: "Activities",
              value: analyticsData.totalActivities,
              category: "tasks"
            },
            {
              label: "Job Applications",
              value: analyticsData.totalJobApplications,
              category: "career"
            }
          ],
          formula: `${analyticsData.totalResumes} + ${analyticsData.totalCourses} + ${analyticsData.totalActivities} + ${analyticsData.totalJobApplications} = ${totalActivity}`
        };

      default:
        return {
          title: "Score Breakdown",
          icon: Calculator,
          score: "N/A",
          description: "No calculation available",
          breakdown: [],
          formula: ""
        };
    }
  };

  const details = getScoreDetails();
  const IconComponent = details.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            {details.title}
          </DialogTitle>
          <DialogDescription>
            {details.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Current Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center text-gradient">
                {details.score}
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {details.breakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {('value' in item) && (
                        <span className="text-sm">
                          {item.value}
                          {('total' in item) && ` / ${item.total}`}
                          {('weight' in item) && ` × ${item.weight}`}
                          {('contribution' in item) && ` = ${item.contribution}`}
                        </span>
                      )}
                      {('percentage' in item) && (
                        <Badge variant="secondary">{item.percentage}%</Badge>
                      )}
                      {('status' in item) && (
                        <Badge variant={
                          item.status === 'completed' ? 'default' :
                          item.status === 'active' ? 'secondary' : 'outline'
                        }>
                          {item.status}
                        </Badge>
                      )}
                      {('category' in item) && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </div>
                  </div>
                  {('percentage' in item) && (
                    <Progress value={item.percentage} className="h-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Formula */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Formula</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-muted p-3 rounded block">
                {details.formula}
              </code>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
