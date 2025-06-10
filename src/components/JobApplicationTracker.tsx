
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
import { Briefcase, Plus, Edit2, Trash2, Calendar, DollarSign, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobApplication {
  id: string;
  companyName: string;
  role: string;
  location: string;
  ctc?: string;
  totalRounds?: number;
  roundsPassed: number;
  dateApplied: string;
  nextRoundDate?: string;
  status: 'In Progress' | 'Shortlisted' | 'Rejected' | 'Accepted';
  lastUpdated: string;
  notes?: string;
}

interface ApplicationUpdate {
  id: string;
  applicationId: string;
  timestamp: string;
  updateType: string;
  details: string;
}

export function JobApplicationTracker() {
  const [jobApplications, setJobApplications] = useLocalStorage<JobApplication[]>('jobApplications', []);
  const [applicationUpdates, setApplicationUpdates] = useLocalStorage<ApplicationUpdate[]>('applicationUpdates', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    location: '',
    ctc: '',
    totalRounds: '',
    roundsPassed: 0,
    dateApplied: '',
    nextRoundDate: '',
    status: 'In Progress' as JobApplication['status'],
    notes: '',
  });
  const [updateData, setUpdateData] = useState({
    updateType: '',
    details: '',
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      companyName: '',
      role: '',
      location: '',
      ctc: '',
      totalRounds: '',
      roundsPassed: 0,
      dateApplied: '',
      nextRoundDate: '',
      status: 'In Progress',
      notes: '',
    });
  };

  const resetUpdateForm = () => {
    setUpdateData({
      updateType: '',
      details: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.companyName || !formData.role || !formData.dateApplied) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingApplication) {
      setJobApplications(prev => 
        prev.map(app => 
          app.id === editingApplication.id 
            ? { 
                ...app, 
                ...formData, 
                totalRounds: formData.totalRounds ? parseInt(formData.totalRounds) : undefined,
                lastUpdated: new Date().toISOString(),
              }
            : app
        )
      );
      toast({
        title: "Application updated",
        description: "Job application has been updated.",
      });
    } else {
      const newApplication: JobApplication = {
        id: crypto.randomUUID(),
        ...formData,
        totalRounds: formData.totalRounds ? parseInt(formData.totalRounds) : undefined,
        lastUpdated: new Date().toISOString(),
      };
      setJobApplications(prev => [...prev, newApplication]);
      toast({
        title: "Application added",
        description: "New job application has been added.",
      });
    }

    setIsDialogOpen(false);
    setEditingApplication(null);
    resetForm();
  };

  const handleUpdateSubmit = () => {
    if (!updateData.updateType || !updateData.details || !selectedApplication) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const newUpdate: ApplicationUpdate = {
      id: crypto.randomUUID(),
      applicationId: selectedApplication.id,
      timestamp: new Date().toISOString(),
      updateType: updateData.updateType,
      details: updateData.details,
    };

    setApplicationUpdates(prev => [...prev, newUpdate]);
    
    // Update the last updated timestamp
    setJobApplications(prev => 
      prev.map(app => 
        app.id === selectedApplication.id 
          ? { ...app, lastUpdated: new Date().toISOString() }
          : app
      )
    );

    setIsUpdateDialogOpen(false);
    setSelectedApplication(null);
    resetUpdateForm();
    
    toast({
      title: "Update added",
      description: "Application update has been recorded.",
    });
  };

  const deleteApplication = (applicationId: string) => {
    setJobApplications(prev => prev.filter(app => app.id !== applicationId));
    setApplicationUpdates(prev => prev.filter(update => update.applicationId !== applicationId));
    toast({
      title: "Application deleted",
      description: "Job application has been removed.",
    });
  };

  const openEditDialog = (application: JobApplication) => {
    setEditingApplication(application);
    setFormData({
      companyName: application.companyName,
      role: application.role,
      location: application.location,
      ctc: application.ctc || '',
      totalRounds: application.totalRounds?.toString() || '',
      roundsPassed: application.roundsPassed,
      dateApplied: application.dateApplied,
      nextRoundDate: application.nextRoundDate || '',
      status: application.status,
      notes: application.notes || '',
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
      .filter(update => update.applicationId === applicationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Job Application Tracker</h2>
          <p className="text-muted-foreground">Track your job applications and interview progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingApplication ? 'Edit Application' : 'Add New Application'}
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
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Tech Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role/Position *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Frontend Developer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div>
                  <Label htmlFor="ctc">CTC (Expected/Offered)</Label>
                  <Input
                    id="ctc"
                    value={formData.ctc}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                    placeholder="e.g., $120,000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalRounds">Total Rounds</Label>
                  <Input
                    id="totalRounds"
                    type="number"
                    value={formData.totalRounds}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalRounds: e.target.value }))}
                    placeholder="e.g., 4"
                  />
                </div>
                <div>
                  <Label htmlFor="roundsPassed">Rounds Passed</Label>
                  <Input
                    id="roundsPassed"
                    type="number"
                    value={formData.roundsPassed}
                    onChange={(e) => setFormData(prev => ({ ...prev, roundsPassed: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: JobApplication['status']) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateApplied">Date Applied *</Label>
                  <Input
                    id="dateApplied"
                    type="date"
                    value={formData.dateApplied}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateApplied: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="nextRoundDate">Next Round Date</Label>
                  <Input
                    id="nextRoundDate"
                    type="date"
                    value={formData.nextRoundDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextRoundDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or comments..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingApplication ? 'Update Application' : 'Add Application'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobApplications.map((application) => {
          const updates = getApplicationUpdates(application.id);
          return (
            <Card key={application.id} className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="truncate">{application.companyName}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUpdateDialog(application)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(application)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApplication(application.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{application.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  
                  <div className="space-y-2 text-sm">
                    {application.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{application.location}</span>
                      </div>
                    )}
                    {application.ctc && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{application.ctc}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Applied: {new Date(application.dateApplied).toLocaleDateString()}</span>
                    </div>
                    {application.nextRoundDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Next: {new Date(application.nextRoundDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {application.totalRounds && (
                      <div className="text-xs text-muted-foreground">
                        Progress: {application.roundsPassed}/{application.totalRounds} rounds
                      </div>
                    )}
                  </div>

                  {updates.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent Updates</h4>
                      <div className="space-y-1">
                        {updates.slice(0, 2).map((update) => (
                          <div key={update.id} className="text-xs">
                            <div className="font-medium">{update.updateType}</div>
                            <div className="text-muted-foreground truncate">{update.details}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {jobApplications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your job applications and interview progress.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Application
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Update</DialogTitle>
            <DialogDescription>
              Record a new update for {selectedApplication?.companyName} - {selectedApplication?.role}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="updateType">Update Type</Label>
              <Select
                value={updateData.updateType}
                onValueChange={(value) => setUpdateData(prev => ({ ...prev, updateType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select update type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="Interview Completed">Interview Completed</SelectItem>
                  <SelectItem value="Feedback Received">Feedback Received</SelectItem>
                  <SelectItem value="Status Change">Status Change</SelectItem>
                  <SelectItem value="Round Passed">Round Passed</SelectItem>
                  <SelectItem value="Round Failed">Round Failed</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="updateDetails">Details</Label>
              <Textarea
                id="updateDetails"
                value={updateData.details}
                onChange={(e) => setUpdateData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Describe the update..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateSubmit} className="w-full">
              Add Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
