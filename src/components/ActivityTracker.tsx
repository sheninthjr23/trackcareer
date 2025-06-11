
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, Plus, Edit2, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  description?: string;
  topic: string;
  start_date: string;
  predicted_end_date: string;
  status: string;
  completed_manually?: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const TOPICS = [
  'Programming',
  'Data Structures',
  'Algorithms',
  'System Design',
  'Web Development',
  'Mobile Development',
  'Machine Learning',
  'DevOps',
  'Database',
  'Networking',
  'Security',
  'Testing',
  'Project Management',
  'Communication',
  'Other'
];

export function ActivityTracker() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    start_date: '',
    predicted_end_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user!.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (activity: Activity) => {
    if (activity.completed_manually) {
      return { status: 'Completed', color: 'status-completed' };
    }
    
    const today = new Date();
    const endDate = new Date(activity.predicted_end_date);
    
    // Set to Asia/Kolkata timezone
    const todayIndia = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    if (todayIndia <= endDate) {
      return { status: 'In Progress', color: 'status-in-progress' };
    } else {
      return { status: 'Overdue', color: 'status-rejected' };
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      topic: '',
      start_date: '',
      predicted_end_date: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.topic || !formData.start_date || !formData.predicted_end_date) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingActivity) {
        const { error } = await supabase
          .from('activities')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingActivity.id);

        if (error) throw error;
        toast({
          title: "Activity updated",
          description: "Activity has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('activities')
          .insert({
            ...formData,
            user_id: user!.id,
          });

        if (error) throw error;
        toast({
          title: "Activity added",
          description: "New activity has been added successfully.",
        });
      }

      setIsDialogOpen(false);
      setEditingActivity(null);
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: "Failed to save activity.",
        variant: "destructive",
      });
    }
  };

  const markCompleted = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          completed_manually: true,
          status: 'Completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', activityId);

      if (error) throw error;
      fetchActivities();
      toast({
        title: "Activity completed",
        description: "Activity has been marked as completed.",
      });
    } catch (error) {
      console.error('Error marking activity as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark activity as completed.",
        variant: "destructive",
      });
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      fetchActivities();
      toast({
        title: "Activity deleted",
        description: "Activity has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || '',
      topic: activity.topic,
      start_date: activity.start_date,
      predicted_end_date: activity.predicted_end_date,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingActivity(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredActivities = activities.filter(activity => 
    selectedTopic === 'all' || activity.topic === selectedTopic
  );

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    if (!groups[activity.topic]) {
      groups[activity.topic] = [];
    }
    groups[activity.topic].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  const upcomingOverdue = activities.filter(activity => {
    const { status } = getActivityStatus(activity);
    const endDate = new Date(activity.predicted_end_date);
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    return status === 'In Progress' && endDate <= twoDaysFromNow;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Activity Tracking</h2>
            <p className="text-muted-foreground">Loading your activities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Activity Tracking</h2>
          <p className="text-muted-foreground text-lg">Monitor your tasks and activities progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="elegant-card">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
              </DialogTitle>
              <DialogDescription>
                {editingActivity 
                  ? 'Update activity details and timeline.'
                  : 'Track a new activity or task in your learning journey.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="activity-title" className="text-white">Title *</Label>
                <Input
                  id="activity-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete System Design Course"
                  className="elegant-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="activity-description" className="text-white">Description</Label>
                <Textarea
                  id="activity-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about this activity..."
                  className="elegant-input mt-2"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="topic" className="text-white">Topic *</Label>
                <Select
                  value={formData.topic}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, topic: value }))}
                >
                  <SelectTrigger className="elegant-input mt-2">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((topic) => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-white">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="elegant-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="predicted-end-date" className="text-white">Predicted End Date *</Label>
                  <Input
                    id="predicted-end-date"
                    type="date"
                    value={formData.predicted_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, predicted_end_date: e.target.value }))}
                    className="elegant-input mt-2"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full button-elegant">
                {editingActivity ? 'Update Activity' : 'Add Activity'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {upcomingOverdue.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {upcomingOverdue.length} activit{upcomingOverdue.length === 1 ? 'y' : 'ies'} approaching deadline
            </p>
            <div className="space-y-2">
              {upcomingOverdue.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between text-sm">
                  <span className="text-white">{activity.title}</span>
                  <span className="text-amber-400">
                    Due: {new Date(activity.predicted_end_date).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card className="elegant-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="text-white">Filter by Topic:</Label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="elegant-input w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities by Topic */}
      {Object.keys(groupedActivities).length === 0 ? (
        <Card className="elegant-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No activities yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking your learning activities and tasks to monitor your progress.
            </p>
            <Button onClick={openAddDialog} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([topic, topicActivities]) => (
            <Card key={topic} className="elegant-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" />
                    {topic}
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                    {topicActivities.length} activit{topicActivities.length === 1 ? 'y' : 'ies'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topicActivities.map((activity) => {
                    const { status, color } = getActivityStatus(activity);
                    return (
                      <Card key={activity.id} className="bg-muted/20 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-white truncate">{activity.title}</h4>
                                <Badge className={color}>{status}</Badge>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Started: {new Date(activity.start_date).toLocaleDateString('en-IN', {
                                    timeZone: 'Asia/Kolkata'
                                  })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due: {new Date(activity.predicted_end_date).toLocaleDateString('en-IN', {
                                    timeZone: 'Asia/Kolkata'
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              {!activity.completed_manually && status !== 'Completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markCompleted(activity.id)}
                                  className="h-8 px-3 text-green-400 hover:bg-green-500/20"
                                >
                                  Complete
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(activity)}
                                className="h-8 w-8 p-0 hover:bg-white/10"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteActivity(activity.id)}
                                className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
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
        </div>
      )}
    </div>
  );
}
