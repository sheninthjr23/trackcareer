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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Building2, MapPin, Calendar, TrendingUp, Edit2, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Target, Briefcase, Users, ArrowRight, Star } from "lucide-react";
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
      case 'In Progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30';
      case 'Shortlisted': return 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30';
      case 'Accepted': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50 hover:bg-gray-500/30';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-600 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Job Application Tracker
            </h1>
            <p className="text-slate-400 text-lg">Loading your career journey...</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-800/50 border-slate-700/50">
                <CardHeader className="space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-6 bg-slate-700/50 rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <Briefcase className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Career Journey Tracker
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Navigate your career path with intelligent tracking and insights
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Application
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
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
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Track Progress
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
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

        {/* Enhanced Statistics Dashboard */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Briefcase className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Target className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Shortlisted</p>
                <p className="text-3xl font-bold text-white">{stats.shortlisted}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Accepted</p>
                <p className="text-3xl font-bold text-white">{stats.accepted}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-white">{stats.rejected}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabbed View */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-1 backdrop-blur-sm">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all duration-300"
              >
                All Applications
              </TabsTrigger>
              <TabsTrigger 
                value="in-progress"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-yellow-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all duration-300"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger 
                value="shortlisted"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all duration-300"
              >
                Shortlisted
              </TabsTrigger>
              <TabsTrigger 
                value="accepted"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all duration-300"
              >
                Accepted
              </TabsTrigger>
              <TabsTrigger 
                value="rejected"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all duration-300"
              >
                Rejected
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-8">
            {getFilteredApplications().length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
                    <Building2 className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {activeTab === 'all' ? 'Start Your Journey' : `No ${activeTab.replace('-', ' ')} applications`}
                  </h3>
                  <p className="text-slate-400 text-center mb-8 max-w-md">
                    {activeTab === 'all' 
                      ? 'Begin tracking your career applications and watch your progress unfold.'
                      : `You don't have any ${activeTab.replace('-', ' ')} applications yet.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Button 
                      onClick={() => setIsAddDialogOpen(true)} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Application
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredApplications().map((application) => (
                  <Card 
                    key={application.id} 
                    className="group bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/80 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-slate-900/50 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                              <Building2 className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg font-semibold">
                                {application.company_name}
                              </CardTitle>
                              <CardDescription className="text-slate-400 flex items-center gap-2 mt-1">
                                <Users className="h-4 w-4" />
                                {application.role}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
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
                            className="h-8 w-8 p-0 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApplication(application.id)}
                            className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <div className="p-1.5 bg-slate-700/50 rounded-md">
                            <MapPin className="h-3.5 w-3.5" />
                          </div>
                          <span>{application.location || 'Remote'}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <div className="p-1.5 bg-slate-700/50 rounded-md">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <span>Applied: {new Date(application.date_applied).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata'
                          })}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(application.status)} flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors font-medium`}>
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                        {application.ctc && (
                          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                            <Star className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold">{application.ctc}</span>
                          </div>
                        )}
                      </div>

                      {application.total_rounds && (
                        <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl p-4 border border-slate-600/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-300 font-medium">Interview Progress</span>
                            <span className="text-white font-semibold">
                              {application.rounds_passed}/{application.total_rounds}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                              style={{ 
                                width: `${(application.rounds_passed / application.total_rounds) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {application.next_round_date && (
                        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                          <div className="p-1.5 bg-blue-500/20 rounded-md">
                            <Calendar className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Next Round</p>
                            <p className="text-sm text-blue-400 font-medium">
                              {new Date(application.next_round_date).toLocaleDateString('en-IN', {
                                timeZone: 'Asia/Kolkata'
                              })}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-blue-400 ml-auto" />
                        </div>
                      )}

                      {getApplicationUpdates(application.id).length > 0 && (
                        <div className="border-t border-slate-700/50 pt-4">
                          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            Recent Updates
                          </h4>
                          <div className="space-y-2 max-h-24 overflow-y-auto">
                            {getApplicationUpdates(application.id).slice(0, 2).map((update) => (
                              <div key={update.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <span className="text-xs text-green-400 font-medium">{update.update_type}</span>
                                    <p className="text-xs text-slate-400 mt-1">{update.details}</p>
                                  </div>
                                </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
