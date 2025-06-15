import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Building2, MapPin, Calendar, TrendingUp, Edit2, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Target, Briefcase, Users, ChevronDown, ChevronRight, User, DollarSign } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState('all');
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
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

  const toggleUpdatesExpansion = (applicationId: string) => {
    setExpandedUpdates(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  const getStatusIcon = (status: JobApplicationStatus) => {
    switch (status) {
      case 'In Progress': return <Clock className="h-4 w-4" />;
      case 'Shortlisted': return <Target className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: JobApplicationStatus) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-600 text-blue-100 border-blue-500';
      case 'Shortlisted': return 'bg-green-600 text-green-100 border-green-500';
      case 'Rejected': return 'bg-red-600 text-red-100 border-red-500';
      case 'Accepted': return 'bg-emerald-600 text-emerald-100 border-emerald-500';
      default: return 'bg-gray-600 text-gray-100 border-gray-500';
    }
  };

  const getApplicationUpdates = (applicationId: string) => {
    return updates.filter(update => update.application_id === applicationId);
  };

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications;
    return applications.filter(app => app.status.toLowerCase().replace(' ', '-') === activeTab);
  };

  const getStatsData = () => {
    const total = applications.length;
    const inProgress = applications.filter(app => app.status === 'In Progress').length;
    const shortlisted = applications.filter(app => app.status === 'Shortlisted').length;
    const accepted = applications.filter(app => app.status === 'Accepted').length;
    const rejected = applications.filter(app => app.status === 'Rejected').length;

    return { total, inProgress, shortlisted, accepted, rejected };
  };

  const stats = getStatsData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Loading Applications...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Job Application Flow
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Track your job applications with a modern, visual flow-based interface
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">{editingApplication ? 'Edit Application' : 'Add New Application'}</DialogTitle>
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
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-white">Role</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white mt-2"
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
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-white">Date Applied</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date_applied}
                        onChange={(e) => setFormData({...formData, date_applied: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="text-white">Status</Label>
                      <Select value={formData.status} onValueChange={(value: JobApplicationStatus) => setFormData({...formData, status: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
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
                        className="bg-gray-800 border-gray-600 text-white mt-2"
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
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-white">Initial Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.initial_notes}
                      onChange={(e) => setFormData({...formData, initial_notes: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {editingApplication ? 'Update Application' : 'Add Application'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-3 rounded-full text-lg font-medium">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Add Update
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Application Update</DialogTitle>
                  <DialogDescription>
                    Record progress or updates for a job application.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="application" className="text-white">Select Application</Label>
                    <Select value={selectedApplicationId} onValueChange={setSelectedApplicationId}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
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
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
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
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="details" className="text-white">Details</Label>
                    <Textarea
                      id="details"
                      value={updateData.details}
                      onChange={(e) => setUpdateData({...updateData, details: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                      rows={3}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Add Update
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Flow */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Total', value: stats.total, icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
              { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'from-yellow-500 to-orange-500' },
              { label: 'Shortlisted', value: stats.shortlisted, icon: Target, color: 'from-green-500 to-emerald-500' },
              { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'from-emerald-500 to-green-600' },
              { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'from-red-500 to-pink-500' }
            ].map((stat, index) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl text-white text-center transform hover:scale-105 transition-all duration-300`}>
                <stat.icon className="h-8 w-8 mx-auto mb-2" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 rounded-2xl p-2 max-w-2xl mx-auto">
            <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
            <TabsTrigger value="in-progress" className="rounded-xl">In Progress</TabsTrigger>
            <TabsTrigger value="shortlisted" className="rounded-xl">Shortlisted</TabsTrigger>
            <TabsTrigger value="accepted" className="rounded-xl">Accepted</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-8">
            {getFilteredApplications().length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-800/50 rounded-3xl p-12 max-w-md mx-auto">
                  <Building2 className="h-20 w-20 text-gray-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {activeTab === 'all' ? 'No applications yet' : `No ${activeTab.replace('-', ' ')} applications`}
                  </h3>
                  <p className="text-gray-400 mb-8">
                    {activeTab === 'all' 
                      ? 'Start tracking your job applications to monitor your career progress.'
                      : `You don't have any ${activeTab.replace('-', ' ')} applications yet.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full px-8 py-3">
                      <Plus className="h-5 w-5 mr-2" />
                      Add First Application
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredApplications().map((application) => {
                  const applicationUpdates = getApplicationUpdates(application.id);
                  
                  return (
                    <div key={application.id} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 transform hover:scale-[1.02] group">
                      {/* Company Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gray-700/50 rounded-lg">
                              <Building2 className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">{application.company_name}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 mb-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{application.role}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{application.location || 'Remote'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            className="h-8 w-8 p-0 hover:bg-blue-500/20 text-blue-400"
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

                      {/* Applied Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Calendar className="h-4 w-4" />
                        <span>Applied: {new Date(application.date_applied).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata'
                        })}</span>
                      </div>

                      {/* Status and CTC */}
                      <div className="flex items-center justify-between mb-6">
                        <Badge className={`${getStatusColor(application.status)} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                        {application.ctc && (
                          <div className="flex items-center gap-1 text-green-400 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            {application.ctc}
                          </div>
                        )}
                      </div>

                      {/* Interview Progress */}
                      {application.total_rounds && (
                        <div className="bg-gray-700/30 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-gray-300 font-medium">Interview Progress</span>
                            <span className="text-white font-bold text-lg">
                              {application.rounds_passed}/{application.total_rounds}
                            </span>
                          </div>
                          <div className="w-full bg-gray-600/50 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(application.rounds_passed / application.total_rounds) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Next Round */}
                      {application.next_round_date && (
                        <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 rounded-xl p-3 mb-4">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Next Round: {new Date(application.next_round_date).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata'
                          })}</span>
                        </div>
                      )}

                      {/* Recent Updates - Flow Chart Style */}
                      {applicationUpdates.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-purple-400" />
                                <span className="text-white font-medium">Recent Updates</span>
                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                                  {applicationUpdates.length}
                                </Badge>
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-3">
                            <div className="relative">
                              {applicationUpdates.slice(0, 3).map((update, index) => (
                                <div key={update.id} className="relative flex gap-3 pb-3">
                                  {/* Timeline Line */}
                                  {index < applicationUpdates.slice(0, 3).length - 1 && (
                                    <div className="absolute left-2 top-6 w-0.5 h-full bg-gradient-to-b from-purple-500 to-blue-500"></div>
                                  )}
                                  
                                  {/* Timeline Dot */}
                                  <div className="relative z-10 w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                                  
                                  {/* Update Content */}
                                  <div className="flex-1 bg-gray-700/40 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-purple-300">{update.update_type}</span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(update.created_at).toLocaleDateString('en-IN', {
                                          timeZone: 'Asia/Kolkata'
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-300">{update.details}</p>
                                  </div>
                                </div>
                              ))}
                              {applicationUpdates.length > 3 && (
                                <div className="text-center">
                                  <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
                                    +{applicationUpdates.length - 3} more updates
                                  </span>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
