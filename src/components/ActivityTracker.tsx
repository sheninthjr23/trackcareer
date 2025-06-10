
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Target, Plus, Edit2, Trash2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  description: string;
  topic: string;
  startDate: string;
  predictedEndDate: string;
  status: 'In Progress' | 'Completed' | 'Overdue';
  createdAt: string;
}

const topics = [
  'Frontend',
  'Backend', 
  'System Design',
  'Database',
  'Data Structures & Algorithms',
  'DevOps',
  'Mobile Development',
  'Machine Learning',
  'Other'
];

export function ActivityTracker() {
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    startDate: '',
    predictedEndDate: '',
    status: 'In Progress' as Activity['status'],
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      topic: '',
      startDate: '',
      predictedEndDate: '',
      status: 'In Progress',
    });
  };

  const getActivityStatus = (activity: Activity): Activity['status'] => {
    if (activity.status === 'Completed') return 'Completed';
    
    const today = new Date();
    const endDate = new Date(activity.predictedEndDate);
    
    if (today > endDate) return 'Overdue';
    return 'In Progress';
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.topic || !formData.startDate || !formData.predictedEndDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.predictedEndDate)) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    if (editingActivity) {
      setActivities(prev => 
        prev.map(activity => 
          activity.id === editingActivity.id 
            ? { ...activity, ...formData }
            : activity
        )
      );
      toast({
        title: "Activity updated",
        description: "Activity information has been updated.",
      });
    } else {
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
      };
      setActivities(prev => [...prev, newActivity]);
      toast({
        title: "Activity added",
        description: "New activity has been added to your tracker.",
      });
    }

    setIsDialogOpen(false);
    setEditingActivity(null);
    resetForm();
  };

  const deleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
    toast({
      title: "Activity deleted",
      description: "Activity has been removed from your tracker.",
    });
  };

  const markAsCompleted = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, status: 'Completed' as Activity['status'] }
          : activity
      )
    );
    toast({
      title: "Activity completed",
      description: "Congratulations on completing this activity!",
    });
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      topic: activity.topic,
      startDate: activity.startDate,
      predictedEndDate: activity.predictedEndDate,
      status: activity.status,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingActivity(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const groupedActivities = activities.reduce((groups, activity) => {
    const topic = activity.topic;
    if (!groups[topic]) {
      groups[topic] = [];
    }
    groups[topic].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Tracking</h2>
          <p className="text-muted-foreground">Monitor your learning activities and project progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
              </DialogTitle>
              <DialogDescription>
                {editingActivity 
                  ? 'Update activity details and timeline.'
                  : 'Track a new learning activity or project.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Activity Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., React Hooks Deep Dive"
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Select
                  value={formData.topic}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, topic: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the activity..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Predicted End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.predictedEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, predictedEndDate: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingActivity ? 'Update Activity' : 'Add Activity'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Activities by Topic */}
      {Object.entries(groupedActivities).map(([topic, topicActivities]) => (
        <Card key={topic}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {topic}
            </CardTitle>
            <CardDescription>
              {topicActivities.length} {topicActivities.length === 1 ? 'activity' : 'activities'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topicActivities.map((activity) => {
                const currentStatus = getActivityStatus(activity);
                return (
                  <Card key={activity.id} className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{activity.title}</h4>
                            <Badge 
                              className={
                                currentStatus === 'Completed' 
                                  ? 'status-completed'
                                  : currentStatus === 'Overdue'
                                  ? 'status-overdue' 
                                  : 'status-in-progress'
                              }
                            >
                              {currentStatus}
                            </Badge>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Start: {new Date(activity.startDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              End: {new Date(activity.predictedEndDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          {currentStatus !== 'Completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsCompleted(activity.id)}
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(activity)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteActivity(activity.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {activities.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your learning activities and project progress.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Activity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
