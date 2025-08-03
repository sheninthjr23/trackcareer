import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Eye, Share, Download, Clock, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface StoryAnalyticsProps {
  onClose: () => void;
}

export function StoryAnalytics({ onClose }: StoryAnalyticsProps) {
  // Fetch analytics data
  const { data: stories = [] } = useQuery({
    queryKey: ['stories_analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: views = [] } = useQuery({
    queryKey: ['story_views'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_views')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate analytics
  const totalStories = stories.length;
  const publishedStories = stories.filter(s => s.status === 'published').length;
  const draftStories = stories.filter(s => s.status === 'draft').length;
  const totalViews = views.length;
  const totalWords = stories.reduce((sum, story) => sum + (story.content?.split(' ').length || 0), 0);

  // Generate chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const viewsData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    views: views.filter(v => v.created_at.startsWith(date)).length
  }));

  const storiesData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    created: stories.filter(s => s.created_at.startsWith(date)).length
  }));

  const statusData = [
    { name: 'Published', value: publishedStories, color: '#10b981' },
    { name: 'Draft', value: draftStories, color: '#f59e0b' },
    { name: 'Archived', value: stories.filter(s => s.status === 'archived').length, color: '#6b7280' }
  ];

  const topStories = stories
    .map(story => ({
      ...story,
      viewCount: views.filter(v => v.story_id === story.id).length
    }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const recentActivity = [
    ...stories.slice(0, 5).map(story => ({
      type: 'story_created',
      title: `Created "${story.title}"`,
      date: story.created_at,
      icon: 'plus'
    })),
    ...views.slice(0, 10).map(view => ({
      type: 'story_viewed',
      title: `Story viewed`,
      date: view.created_at,
      icon: 'eye'
    }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Story Analytics</h1>
            <p className="text-muted-foreground">Track your writing progress and engagement</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStories}</div>
                <p className="text-xs text-muted-foreground">
                  {publishedStories} published, {draftStories} drafts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
                <p className="text-xs text-muted-foreground">
                  Across all stories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all stories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Words/Story</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalStories > 0 ? Math.round(totalWords / totalStories) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per story
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stories by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Top Stories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStories.map((story, index) => (
                  <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <h4 className="font-semibold">{story.title}</h4>
                        <Badge variant={story.status === 'published' ? 'default' : 'secondary'}>
                          {story.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {story.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created {new Date(story.created_at).toLocaleDateString()}</span>
                        <span>{story.content?.split(' ').length || 0} words</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{story.viewCount}</div>
                      <div className="text-xs text-muted-foreground">views</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Writing Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storiesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="created" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg. Read Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalStories > 0 ? Math.round((totalWords / totalStories) / 200) : 0} min
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on 200 words/min
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalStories > 0 ? Math.round((publishedStories / totalStories) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Stories published vs drafted
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg. Views/Story</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {publishedStories > 0 ? Math.round(totalViews / publishedStories) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  For published stories
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border-l-2 border-muted pl-4">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Writing Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Writing Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Most Productive Day</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your story creation history, you tend to write most on weekends.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Average Story Length</h4>
                  <p className="text-sm text-muted-foreground">
                    Your stories average {totalStories > 0 ? Math.round(totalWords / totalStories) : 0} words, 
                    which is ideal for medium-form content.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Publishing Consistency</h4>
                  <p className="text-sm text-muted-foreground">
                    You publish {totalStories > 0 ? Math.round((publishedStories / totalStories) * 100) : 0}% 
                    of your drafted stories.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Keep Writing!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You're building great momentum. Try to maintain a regular writing schedule.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Engagement Opportunity
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Consider adding more interactive elements to increase reader engagement.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Version Control
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Use version control more frequently to track your story evolution.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}