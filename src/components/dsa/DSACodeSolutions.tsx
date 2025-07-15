
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Plus, Copy, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeSolution {
  id: string;
  language: 'cpp' | 'java' | 'python' | 'javascript';
  code: string;
  notes?: string;
  created_at: string;
}

interface DSACodeSolutionsProps {
  problemId: string;
  codeSolutions: CodeSolution[];
}

const LANGUAGE_COLORS = {
  cpp: 'bg-blue-100 text-blue-800',
  java: 'bg-orange-100 text-orange-800',
  python: 'bg-green-100 text-green-800',
  javascript: 'bg-yellow-100 text-yellow-800',
};

const LANGUAGE_NAMES = {
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
};

// Map our language keys to syntax highlighter language names
const SYNTAX_LANGUAGE_MAP = {
  cpp: 'cpp',
  java: 'java',
  python: 'python',
  javascript: 'javascript',
};

export const DSACodeSolutions: React.FC<DSACodeSolutionsProps> = ({
  problemId,
  codeSolutions,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<CodeSolution | null>(null);
  const [newSolution, setNewSolution] = useState({
    language: 'cpp' as const,
    code: '',
    notes: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCodeSolutionsMutation = useMutation({
    mutationFn: async (solutions: CodeSolution[]) => {
      // Convert to plain JSON objects for database storage
      const solutionsForDb = solutions.map(sol => ({
        id: sol.id,
        language: sol.language,
        code: sol.code,
        notes: sol.notes || '',
        created_at: sol.created_at
      }));

      const { data, error } = await supabase
        .from('dsa_problems')
        .update({ code_solutions: solutionsForDb })
        .eq('id', problemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-live-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-practice-problems'] });
      toast({ title: 'Code solution updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating code solution', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddSolution = () => {
    if (!newSolution.code.trim()) {
      toast({ title: 'Please enter code', variant: 'destructive' });
      return;
    }

    const solution: CodeSolution = {
      id: Date.now().toString(),
      language: newSolution.language,
      code: newSolution.code,
      notes: newSolution.notes,
      created_at: new Date().toISOString(),
    };

    const updatedSolutions = [...codeSolutions, solution];
    updateCodeSolutionsMutation.mutate(updatedSolutions);
    
    setNewSolution({ language: 'cpp', code: '', notes: '' });
    setIsAddDialogOpen(false);
  };

  const handleEditSolution = () => {
    if (!selectedSolution) return;

    const updatedSolutions = codeSolutions.map(sol => 
      sol.id === selectedSolution.id ? selectedSolution : sol
    );
    updateCodeSolutionsMutation.mutate(updatedSolutions);
    
    setSelectedSolution(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteSolution = (solutionId: string) => {
    const updatedSolutions = codeSolutions.filter(sol => sol.id !== solutionId);
    updateCodeSolutionsMutation.mutate(updatedSolutions);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied to clipboard' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold flex items-center gap-2">
          <Code className="h-4 w-4" />
          Code Solutions ({codeSolutions.length})
        </h4>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Solution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Code Solution</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Programming Language</label>
                <Select 
                  value={newSolution.language} 
                  onValueChange={(value) => setNewSolution({ ...newSolution, language: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Code</label>
                <Textarea
                  value={newSolution.code}
                  onChange={(e) => setNewSolution({ ...newSolution, code: e.target.value })}
                  placeholder="Enter your code solution here..."
                  className="min-h-[300px] font-mono text-sm"
                  style={{ 
                    backgroundColor: '#1e1e1e', 
                    color: '#d4d4d4',
                    border: '1px solid #333'
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={newSolution.notes}
                  onChange={(e) => setNewSolution({ ...newSolution, notes: e.target.value })}
                  placeholder="Add any notes about this solution..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSolution}>
                  Add Solution
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {codeSolutions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No code solutions added yet.</p>
          <p className="text-sm">Add your first solution to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {codeSolutions.map((solution) => (
            <Card key={solution.id} className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <Badge className={LANGUAGE_COLORS[solution.language]}>
                    {LANGUAGE_NAMES[solution.language]}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSolution(solution);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(solution.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSolution(solution);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSolution(solution.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded overflow-hidden max-h-32 overflow-y-auto">
                  <SyntaxHighlighter
                    language={SYNTAX_LANGUAGE_MAP[solution.language]}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      fontSize: '11px',
                      lineHeight: '1.2',
                      maxHeight: '128px',
                      background: '#1e1e1e',
                    }}
                    showLineNumbers={false}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {solution.code.substring(0, 200)}{solution.code.length > 200 ? '...' : ''}
                  </SyntaxHighlighter>
                </div>
                {solution.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {solution.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Solution Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={selectedSolution ? LANGUAGE_COLORS[selectedSolution.language] : ''}>
                {selectedSolution ? LANGUAGE_NAMES[selectedSolution.language] : ''}
              </Badge>
              Solution Preview
            </DialogTitle>
          </DialogHeader>
          {selectedSolution && (
            <div className="space-y-4">
              <div className="rounded overflow-hidden">
                <SyntaxHighlighter
                  language={SYNTAX_LANGUAGE_MAP[selectedSolution.language]}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    background: '#1e1e1e',
                    borderRadius: '6px',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {selectedSolution.code}
                </SyntaxHighlighter>
              </div>
              {selectedSolution.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedSolution.notes}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(selectedSolution.code)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Solution Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Code Solution</DialogTitle>
          </DialogHeader>
          {selectedSolution && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Programming Language</label>
                <Select 
                  value={selectedSolution.language} 
                  onValueChange={(value) => setSelectedSolution({ 
                    ...selectedSolution, 
                    language: value as any 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Code</label>
                <Textarea
                  value={selectedSolution.code}
                  onChange={(e) => setSelectedSolution({ 
                    ...selectedSolution, 
                    code: e.target.value 
                  })}
                  className="min-h-[300px] font-mono text-sm"
                  style={{ 
                    backgroundColor: '#1e1e1e', 
                    color: '#d4d4d4',
                    border: '1px solid #333'
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={selectedSolution.notes || ''}
                  onChange={(e) => setSelectedSolution({ 
                    ...selectedSolution, 
                    notes: e.target.value 
                  })}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSolution}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
