
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
import { BookOpen, Plus, Edit2, Trash2, ExternalLink, Github, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  course_link?: string;
  github_link?: string;
  provider_name?: string;
  status: 'In Progress' | 'Completed';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function CourseManager() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchProvider, setSearchProvider] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    course_link: '',
    github_link: '',
    provider_name: '',
    status: 'In Progress' as 'In Progress' | 'Completed',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data as Course[]);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      course_link: '',
      github_link: '',
      provider_name: '',
      status: 'In Progress',
    });
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({
        title: "Missing fields",
        description: "Please fill in the course title.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast({
          title: "Course updated",
          description: "Course has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            ...formData,
            user_id: user!.id,
          });

        if (error) throw error;
        toast({
          title: "Course added",
          description: "New course has been added successfully.",
        });
      }

      setIsDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "Failed to save course.",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      toast({
        title: "Course deleted",
        description: "Course has been removed successfully.",
      });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      course_link: course.course_link || '',
      github_link: course.github_link || '',
      provider_name: course.provider_name || '',
      status: course.status,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCourse(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    const matchesProvider = !searchProvider || 
      (course.provider_name && course.provider_name.toLowerCase().includes(searchProvider.toLowerCase()));
    return matchesStatus && matchesProvider;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
            <p className="text-muted-foreground">Loading your courses...</p>
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
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-8 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Course Management</h2>
          <p className="text-muted-foreground text-lg">Track your learning journey and course progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="elegant-card">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </DialogTitle>
              <DialogDescription>
                {editingCourse 
                  ? 'Update course details and progress.'
                  : 'Add a new course to track your learning journey.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course-title" className="text-white">Title *</Label>
                <Input
                  id="course-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., React Advanced Patterns"
                  className="elegant-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="course-link" className="text-white">Course Link (URL)</Label>
                <Input
                  id="course-link"
                  type="url"
                  value={formData.course_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_link: e.target.value }))}
                  placeholder="https://example.com/course"
                  className="elegant-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="github-link" className="text-white">GitHub Link (optional)</Label>
                <Input
                  id="github-link"
                  type="url"
                  value={formData.github_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, github_link: e.target.value }))}
                  placeholder="https://github.com/username/repo"
                  className="elegant-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="provider-name" className="text-white">Provider/Lecturer Name</Label>
                <Input
                  id="provider-name"
                  value={formData.provider_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider_name: e.target.value }))}
                  placeholder="e.g., Udemy, Coursera, or Instructor Name"
                  className="elegant-input mt-2"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'In Progress' | 'Completed') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="elegant-input mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full button-elegant">
                {editingCourse ? 'Update Course' : 'Add Course'}
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
              <Label htmlFor="search-provider" className="text-white text-sm">Search by Provider</Label>
              <Input
                id="search-provider"
                placeholder="Search by provider name..."
                value={searchProvider}
                onChange={(e) => setSearchProvider(e.target.value)}
                className="elegant-input mt-1"
              />
            </div>
            <div className="sm:w-48">
              <Label className="text-white text-sm">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="elegant-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="elegant-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking your learning journey by adding your first course.
            </p>
            <Button onClick={openAddDialog} className="button-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="card-hover elegant-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="truncate">{course.title}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(course)}
                      className="h-8 w-8 p-0 hover:bg-white/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCourse(course.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                {course.provider_name && (
                  <CardDescription className="text-muted-foreground">
                    {course.provider_name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge 
                    className={
                      course.status === 'Completed'
                        ? 'status-completed'
                        : 'status-in-progress'
                    }
                  >
                    {course.status}
                  </Badge>
                  
                  <div className="flex gap-2">
                    {course.course_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="button-elegant-outline flex-1"
                        onClick={() => window.open(course.course_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Course
                      </Button>
                    )}
                    {course.github_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="button-elegant-outline flex-1"
                        onClick={() => window.open(course.github_link, '_blank')}
                      >
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Added: {new Date(course.created_at).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata'
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
