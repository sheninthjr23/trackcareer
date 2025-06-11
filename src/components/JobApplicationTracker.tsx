
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
import { Briefcase, Plus, Edit2, Trash2, Calendar, DollarSign, MapPin, Building2, ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobApplication {
  id: string;
  company_name: string;
  role: string;
  location?: string;
  ctc?: string;
  total_rounds?: number;
  rounds_passed: number;
  date_applied: string;
  next_round_date?: string;
  status: 'In Progress' | 'Shortlisted' | 'Rejected' | 'Accepted';
  initial_notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ApplicationUpdate {
  id: string;
  application_id: string;
  timestamp: string;
  update_type: string;
  details: string;
  update_date?: string;
  created_at: string;
}

const UPDATE_TYPES = [
  'Interview Scheduled',
  'Interview Completed',
  'Round Passed',
  'Round Failed',
  'Feedback Received',
  'Status Change',
  'Other'
];

export function JobApplicationTracker() {
  const { user } = useAuth();
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [applicationUpdates, setApplicationUpdates] = useState<ApplicationUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchCompany, setSearchCompany] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    role: '',
    location: '',
    ctc: '',
    total_rounds: '',
    date_applied: '',
    next_round_date: '',
    status: 'In Progress' as JobApplication['status'],
    initial_notes: '',
  });
  const [updateData, setUpdateData] = useState({
    update_type: '',
    details: '',
    update_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [applicationsResult, updatesResult] = await Promise.all([
        supabase.from('job_applications').select('*').eq('user_id', user!.id).order('date_applied', { ascending: false }),
        supabase.from('application_updates').select('*').order('timestamp', { ascending: false })
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (updatesResult.error) throw updatesResult.error;

      setJobApplications(applicationsResult.data || []);
      setApplicationUpdates(updatesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      role: '',
      location: '',
      ctc: '',
      total_rounds: '',
      date_applied: '',
      next_round_date: '',
      status: 'In Progress',
      initial_notes: '',
    });
  };

  const resetUpdateForm = () => {
    setUpdateData({
      update_type: '',
      details: '',
      update_date: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.company_name || !formData.role || !formData.date_applied) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingApplication) {
        const { error } = await supabase
          .from('job_applications')
          .update({
            ...formData,
            total_rounds: formData.total_rounds ? parseInt(formData.total_rounds) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingApplication.id);

        if (error) throw error;
        toast({
          title: "Application updated",
          description: "Job application has been updated.",
        });
      } else {
        const { data, error } = await supabase
          .from('job_applications')
          .insert({
            ...formData,
            total_rounds: formData.total_rounds ? parseInt(formData.total_rounds) : null,
            rounds_passed: 0,
            user_id: user!.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Add initial update if notes provided
        if (formData.initial_notes) {
          await supabase
            .from('application_updates')
            .insert({
              application_id: data.id,
              update_type: 'Initial Application',
              details: formData.initial_notes,
              timestamp: new Date().toISOString(),
            });
        }

        toast({
          title: "Application added",
          description: "New job application has been added.",
        });
      }

      setIsDialogOpen(false);
      setEditingApplication(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving application:', error);
      toast({
        title: "Error",
        description: "Failed to save application.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubmit = async () => {
    if (!updateData.update_type || !updateData.details || !selectedApplication) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase
        .from('application_updates')
        .insert({
          application_id: selectedApplication.id,
          update_type: updateData.update_type,
          details: updateData.details,
          update_date: updateData.update_date || null,
          timestamp: new Date().toISOString(),
        });

      // Update application based on update type
      const updates: Partial<JobApplication> = { updated_at: new Date().toISOString() };
      
      if (updateData.update_type === 'Round Passed') {
        updates.rounds_passed = selectedApplication.rounds_passed + 1;
      } else if (updateData.update_type === 'Interview Scheduled' && updateData.update_date) {
        updates.next_round_date = updateData.update_date;
      }

      if (Object.keys(updates).length > 1) {
        await supabase
          .from('job_applications')
          .update(updates)
          .eq('id', selectedApplication.id);
      }

      setIsUpdateDialogOpen(false);
      setSelectedApplication(null);
      resetUpdateForm();
      fetchData();
      
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

  const deleteApplication = async (applicationId: string) => {
    try {
      // Delete updates first
      await supabase
        .from('application_updates')
        .delete()
        .eq('application_id', applicationId);

      // Delete application
      await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      fetchData();
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

  const openEditDialog = (application: JobApplication) => {
    setEditingApplication(application);
    setFormData({
      company_name: application.company_name,
      role: application.role,
      location: application.location || '',
      ctc: application.ctc || '',
      total_rounds: application.total_rounds?.toString() || '',
      date_applied: application.date_applied,
      next_round_date: application.next_round_date || '',
      status: application.status,
      initial_notes: application.initial_notes || '',
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingApplication(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openUpdateDialog = (application: JobApplication) => {
    setSelectedApplication(application);
    resetUpdateForm();
    setIsUpdateDialogOpen(true);
  };

  const getApplicationUpdates = (applicationId: string) => {
    return applicationUpdates
      .filter(update => update.application_id === applicationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filteredApplications = jobApplications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesCompany = !searchCompany || 
      app.company_name.toLowerCase().includes(searchCompany.toLowerCase());
    return matchesStatus && matchesCompany;
  });

  const groupedApplications = filteredApplications.reduce((groups, app) => {
    const date = new Date(app.date_applied);
    const monthYear = date.toLocaleDateString('en-IN', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(app);
    return groups;
  }, {} as Record<string, JobApplication[]>);

  const toggleMonth = (monthYear: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthYear)) {
      newExpanded.delete(monthYear);
    } else {
      newExpanded.add(monthYear);
    }
    setExpandedMonths(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Job Application Tracker</h2>
            <p className="text-muted-foreground">Loading your applications...</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Job Application Tracker</h2>
          <p className="text-muted-foreground text-lg">Keep track of your job applications and progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="elegant-card sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingApplication ? 'Edit Application' : 'New Application'}
              </DialogTitle>
              <DialogDescription>
                {editingApplication 
                  ? 'Update job application details and status.'
                  : 'Record a new job application to track your progress.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name" className="text-white">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="e.g., Tech Corp"
                    className="elegant-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-white">Role/Position *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Frontend Developer"
                    className="elegant-input mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., San Francisco, CA"
                    className="elegant-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ctc" className="text-white">CTC (optional)</Label>
                  <Input
                    id="ctc"
                    value={formData.ctc}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                    placeholder="e.g., $120,000"
                    className="elegant-input mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total-rounds" className="text-white">Total Rounds</Label>
                  <Input
                    id="total-rounds"
                    type="number"
                    min="1"
                    value={formData.total_rounds}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_rounds: e.target.value }))}
                    placeholder="e.g., 4"
                    className="elegant-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="next-round-date" className="text-white">Next Round Date</Label>
                  <Input
                    id="next-round-date"
                    type="date"
                    value={formData.next_round_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_round_date: e.target.value }))}
                    className="elegant-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: JobApplication['status']) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
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
              </div>
              <div>
                <Label htmlFor="date-applied" className="text-white">Date Applied *</Label>
                <Input
                  id="date-applied"
                  type="date"
                  value={formData.date_applied}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_applied: e.target.value }))}
                  className="elegant-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="initial-notes" className="text-white">Initial Notes</Label>
                <Textarea
                  id="initial-notes"
                  value={formData.initial_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, initial_notes: e.target.value }))}
                  placeholder="Additional notes or comments..."
                  rows={3}
                  className="elegant-input mt-2"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full button-elegant">
                {editingApplication ? 'Update Application' : 'Add Application'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="elegant-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-white text-sm">Search by Company</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search company name..."
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  className="elegant-input pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label className="text-white text-sm">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="elegant-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications by Month */}
      {Object.keys(groupedApplications).length === 0 ? (
        <Card className="elegant-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking your job applications and interview progress.
            </p>
            <Button onClick={openAddDialog} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedApplications).map(([monthYear, applications]) => {
            const isExpanded = expandedMonths.has(monthYear);
            return (
              <Card key={monthYear} className="elegant-card">
                <CardHeader 
                  className="cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleMonth(monthYear)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                      {monthYear}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      {applications.length} application{applications.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {applications.map((application) => {
                        const updates = getApplicationUpdates(application.id);
                        return (
                          <Card key={application.id} className="bg-muted/20 border-white/10 card-hover">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                      <h4 className="font-semibold text-white truncate">
                                        {application.company_name} – {application.role}
                                      </h4>
                                    </div>
                                    <Badge 
                                      className={
                                        application.status === 'Accepted' 
                                          ? 'status-completed'
                                          : application.status === 'Rejected'
                                          ? 'status-rejected'
                                          : application.status === 'Shortlisted'
                                          ? 'status-in-progress'
                                          : 'status-pending'
                                      }
                                    >
                                      {application.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                                    {application.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {application.location}
                                      </div>
                                    )}
                                    {application.ctc && (
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        {application.ctc}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Applied: {new Date(application.date_applied).toLocaleDateString('en-IN', {
                                        timeZone: 'Asia/Kolkata'
                                      })}
                                    </div>
                                    {application.next_round_date && (
                                      <div className="flex items-center gap-1 text-primary">
                                        <Calendar className="h-3 w-3" />
                                        Next: {new Date(application.next_round_date).toLocaleDateString('en-IN', {
                                          timeZone: 'Asia/Kolkata'
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {application.total_rounds && (
                                    <div className="text-xs text-muted-foreground mb-3">
                                      Progress: {application.rounds_passed}/{application.total_rounds} rounds
                                    </div>
                                  )}

                                  {updates.length > 0 && (
                                    <div className="border-t border-white/10 pt-3">
                                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">Recent Updates</h5>
                                      <div className="space-y-1">
                                        {updates.slice(0, 2).map((update) => (
                                          <div key={update.id} className="text-xs">
                                            <div className="font-medium text-white">{update.update_type}</div>
                                            <div className="text-muted-foreground truncate">{update.details}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-1 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openUpdateDialog(application)}
                                    className="h-8 px-3 text-green-400 hover:bg-green-500/20"
                                  >
                                    Update
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(application)}
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
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="elegant-card">
          <DialogHeader>
            <DialogTitle>Add Update</DialogTitle>
            <DialogDescription>
              Record a new update for {selectedApplication?.company_name} - {selectedApplication?.role}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="update-type" className="text-white">Update Type</Label>
              <Select
                value={updateData.update_type}
                onValueChange={(value) => setUpdateData(prev => ({ ...prev, update_type: value }))}
              >
                <SelectTrigger className="elegant-input mt-2">
                  <SelectValue placeholder="Select update type" />
                </SelectTrigger>
                <SelectContent>
                  {UPDATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(updateData.update_type === 'Interview Scheduled' || updateData.update_type === 'Interview Completed') && (
              <div>
                <Label htmlFor="update-date" className="text-white">Date</Label>
                <Input
                  id="update-date"
                  type="date"
                  value={updateData.update_date}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, update_date: e.target.value }))}
                  className="elegant-input mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="update-details" className="text-white">Details/Notes</Label>
              <Textarea
                id="update-details"
                value={updateData.details}
                onChange={(e) => setUpdateData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Describe the update..."
                rows={3}
                className="elegant-input mt-2"
              />
            </div>
            <Button onClick={handleUpdateSubmit} className="w-full button-elegant">
              Add Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
