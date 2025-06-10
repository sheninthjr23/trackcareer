
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BookOpen, ExternalLink, Github, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  courseLink: string;
  githubLink?: string;
  providerName: string;
  createdAt: string;
  status: 'In Progress' | 'Completed';
}

export function CourseManager() {
  const [courses, setCourses] = useLocalStorage<Course[]>('courses', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    courseLink: '',
    githubLink: '',
    providerName: '',
    status: 'In Progress' as Course['status'],
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: '',
      courseLink: '',
      githubLink: '',
      providerName: '',
      status: 'In Progress',
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.courseLink || !formData.providerName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingCourse) {
      setCourses(prev => 
        prev.map(course => 
          course.id === editingCourse.id 
            ? { ...course, ...formData }
            : course
        )
      );
      toast({
        title: "Course updated",
        description: "Course information has been updated.",
      });
    } else {
      const newCourse: Course = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setCourses(prev => [...prev, newCourse]);
      toast({
        title: "Course added",
        description: "New course has been added to your list.",
      });
    }

    setIsDialogOpen(false);
    setEditingCourse(null);
    resetForm();
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
    toast({
      title: "Course deleted",
      description: "Course has been removed from your list.",
    });
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      courseLink: course.courseLink,
      githubLink: course.githubLink || '',
      providerName: course.providerName,
      status: course.status,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCourse(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
          <p className="text-muted-foreground">Track your learning journey and course progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </DialogTitle>
              <DialogDescription>
                {editingCourse 
                  ? 'Update course information and progress.'
                  : 'Add a new course to track your learning progress.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., React Advanced Patterns"
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider/Lecturer *</Label>
                <Input
                  id="provider"
                  value={formData.providerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                  placeholder="e.g., Udemy, Coursera, John Doe"
                />
              </div>
              <div>
                <Label htmlFor="courseLink">Course URL *</Label>
                <Input
                  id="courseLink"
                  value={formData.courseLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseLink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="githubLink">GitHub Repository (Optional)</Label>
                <Input
                  id="githubLink"
                  value={formData.githubLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, githubLink: e.target.value }))}
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Course['status']) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingCourse ? 'Update Course' : 'Add Course'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="truncate">{course.title}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {course.providerName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(course.courseLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Course
                  </Button>
                  {course.githubLink && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(course.githubLink, '_blank')}
                    >
                      <Github className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Added: {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your learning journey by adding your first course.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Course
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
