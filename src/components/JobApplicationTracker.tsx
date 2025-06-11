
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Building2, MapPin, Calendar, TrendingUp, Edit2, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type JobApplicationStatus = "In Progress" | "Shortlisted" | "Rejected" | "Accepted";

interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  location?: string;
  date_applied: string;
  status: JobApplicationStatus;
  ctc?: string;
  total_rounds?: number;
  rounds_passed: number;
  next_round_date?: string;
  initial_notes?: string;
  created_at: string;
  updated_at: string;
}

interface ApplicationUpdate {
  id: string;
  application_id: string;
  update_type: string;
  update_date?: string;
  details: string;
  timestamp: string;
  created_at: string;
}

export function JobApplicationTracker() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [updates, setUpdates] = useState<ApplicationUpdate[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    company_name: '',
    role: '',
    location: '',
    date_applied: '',
    status: 'In Progress' as JobApplicationStatus,
    ctc: '',
    total_rounds: '',
    initial_notes: ''
  });

  const [updateData, setUpdateData] = useState({
    update_type: '',
    update_date: '',
    details: ''
  });

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchUpdates();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion with proper conversion
      const typedApplications: JobApplication[] = (data || []).map(app => ({
        ...app,
        status: app.status as JobApplicationStatus
      }));
      
      setApplications(typedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('application_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const applicationData = {
        ...formData,
        user_id: user!.id,
        total_rounds: formData.total_rounds ? parseInt(formData.total_rounds) : null,
        rounds_passed: 0
      };

      if (editingApplication) {
        const { error } = await supabase
          .from('job_applications')
          .update(applicationData)
          .eq('id', editingApplication.id);

        if (error) throw error;
        
        toast({
          title: "Application updated",
          description: "Job application has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('job_applications')
          .insert([applicationData]);

        if (error) throw error;
        
        toast({
          title: "Application added",
          description: "New job application has been added successfully.",
        });
      }

      setFormData({
        company_name: '',
        role: '',
        location: '',
        date_applied: '',
        status: 'In Progress',
        ctc: '',
        total_rounds: '',
        initial_notes: ''
      });
      setEditingApplication(null);
      setIsAddDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error saving application:', error);
      toast({
        title: "Error",
        description: "Failed to save job application.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('application_updates')
        .insert([{
          application_id: selectedApplicationId,
          ...updateData
        }]);

      if (error) throw error;
      
      setUpdateData({
        update_type: '',
        update_date: '',
        details: ''
      });
      setIsUpdateDialogOpen(false);
      fetchUpdates();
      toast({
        title: "Update added",
        description: "Application update has been recorded.",
      });
    } catch (error) {
      console.error('Error adding update:', error);
      toast({
        title: "Error",
        description: "Failed to add update.",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchApplications();
      toast({
        title: "Application deleted",
        description: "Job application has been removed.",
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: JobApplicationStatus) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Shortlisted': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Accepted': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getApplicationUpdates = (applicationId: string) => {
    return updates.filter(update => update.application_id === applicationId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Job Applications</h2>
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Job Applications</h2>
          <p className="text-muted-foreground text-lg">Track your job applications and interview progress</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="button-elegant">
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingApplication ? 'Edit Application' : 'Add New Application'}</DialogTitle>
                <DialogDescription>
                  {editingApplication ? 'Update the job application details.' : 'Track a new job application.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company" className="text-white">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      className="elegant-input mt-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-white">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="elegant-input mt-2"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="text-white">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="elegant-input mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date" className="text-white">Date Applied</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date_applied}
                      onChange={(e) => setFormData({...formData, date_applied: e.target.value})}
                      className="elegant-input mt-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status" className="text-white">Status</Label>
                    <Select value={formData.status} onValueChange={(value: JobApplicationStatus) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="elegant-input mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ctc" className="text-white">CTC (Optional)</Label>
                    <Input
                      id="ctc"
                      value={formData.ctc}
                      onChange={(e) => setFormData({...formData, ctc: e.target.value})}
                      placeholder="e.g., 12 LPA"
                      className="elegant-input mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rounds" className="text-white">Total Rounds (Optional)</Label>
                  <Input
                    id="rounds"
                    type="number"
                    value={formData.total_rounds}
                    onChange={(e) => setFormData({...formData, total_rounds: e.target.value})}
                    className="elegant-input mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-white">Initial Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.initial_notes}
                    onChange={(e) => setFormData({...formData, initial_notes: e.target.value})}
                    className="elegant-input mt-2"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full button-elegant">
                  {editingApplication ? 'Update Application' : 'Add Application'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="button-elegant-outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Add Update
              </Button>
            </DialogTrigger>
            <DialogContent className="elegant-card">
              <DialogHeader>
                <DialogTitle>Add Application Update</DialogTitle>
                <DialogDescription>
                  Record progress or updates for a job application.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="application" className="text-white">Select Application</Label>
                  <Select value={selectedApplicationId} onValueChange={setSelectedApplicationId}>
                    <SelectTrigger className="elegant-input mt-2">
                      <SelectValue placeholder="Choose application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.company_name} - {app.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="update-type" className="text-white">Update Type</Label>
                  <Select value={updateData.update_type} onValueChange={(value) => setUpdateData({...updateData, update_type: value})}>
                    <SelectTrigger className="elegant-input mt-2">
                      <SelectValue placeholder="Select update type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Round Passed">Round Passed</SelectItem>
                      <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="Status Change">Status Change</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="update-date" className="text-white">Update Date (Optional)</Label>
                  <Input
                    id="update-date"
                    type="date"
                    value={updateData.update_date}
                    onChange={(e) => setUpdateData({...updateData, update_date: e.target.value})}
                    className="elegant-input mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="details" className="text-white">Details</Label>
                  <Textarea
                    id="details"
                    value={updateData.details}
                    onChange={(e) => setUpdateData({...updateData, details: e.target.value})}
                    className="elegant-input mt-2"
                    rows={3}
                    required
                  />
                </div>

                <Button type="submit" className="w-full button-elegant">
                  Add Update
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Applications Grid */}
      {applications.length === 0 ? (
        <Card className="elegant-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking your job applications to monitor your career progress.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id} className="card-hover elegant-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-white truncate">{application.company_name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{application.role}</CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingApplication(application);
                        setFormData({
                          company_name: application.company_name,
                          role: application.role,
                          location: application.location || '',
                          date_applied: application.date_applied,
                          status: application.status,
                          ctc: application.ctc || '',
                          total_rounds: application.total_rounds?.toString() || '',
                          initial_notes: application.initial_notes || ''
                        });
                        setIsAddDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 hover:bg-white/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApplication(application.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{application.location || 'Location not specified'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Applied: {new Date(application.date_applied).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata'
                  })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                  {application.ctc && (
                    <span className="text-sm font-medium text-white">{application.ctc}</span>
                  )}
                </div>

                {application.total_rounds && (
                  <div className="text-sm text-muted-foreground">
                    Progress: {application.rounds_passed}/{application.total_rounds} rounds
                  </div>
                )}

                {application.next_round_date && (
                  <div className="text-sm text-muted-foreground">
                    Next Round: {new Date(application.next_round_date).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata'
                    })}
                  </div>
                )}

                {getApplicationUpdates(application.id).length > 0 && (
                  <div className="border-t border-white/10 pt-3">
                    <h4 className="text-sm font-medium text-white mb-2">Recent Updates</h4>
                    <div className="space-y-2">
                      {getApplicationUpdates(application.id).slice(0, 2).map((update) => (
                        <div key={update.id} className="text-xs text-muted-foreground">
                          <span className="font-medium">{update.update_type}</span>: {update.details}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
