import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Github, Edit, Trash2, Youtube, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { DSACodeSolutions } from './DSACodeSolutions';

interface DSAProblem {
  id: string;
  title: string;
  problem_link: string | null;
  topic: string;
  level: 'Easy' | 'Medium' | 'Hard';
  github_solution_link: string | null;
  youtube_link: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  folder_id: string;
  code_solutions: any[];
  is_live_problem: boolean;
  live_added_at: string | null;
}

interface DraggableProblemProps {
  problem: DSAProblem;
  expandedProblem: string | null;
  onToggleCompletion: (id: string, isCompleted: boolean) => void;
  onEdit: (problem: DSAProblem) => void;
  onDelete: (id: string) => void;
  onToggleExpanded: (id: string | null) => void;
}

export const DraggableProblem: React.FC<DraggableProblemProps> = ({
  problem,
  expandedProblem,
  onToggleCompletion,
  onEdit,
  onDelete,
  onToggleExpanded,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: problem.id,
    data: {
      problem,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Easy': return 'default';
      case 'Medium': return 'secondary';
      case 'Hard': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 space-y-4 transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Checkbox
            checked={problem.is_completed}
            onCheckedChange={(checked) =>
              onToggleCompletion(problem.id, !!checked)
            }
          />
          <div>
            <h3 className="font-medium">{problem.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getLevelBadgeVariant(problem.level)}>
                {problem.level}
              </Badge>
              <span className="text-sm text-muted-foreground">{problem.topic}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {problem.problem_link && (
            <Button size="sm" variant="outline" asChild>
              <a href={problem.problem_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          {problem.github_solution_link && (
            <Button size="sm" variant="outline" asChild>
              <a href={problem.github_solution_link} target="_blank" rel="noopener noreferrer">
                <Github className="h-3 w-3" />
              </a>
            </Button>
          )}
          {problem.youtube_link && (
            <Button size="sm" variant="outline" asChild>
              <a href={problem.youtube_link} target="_blank" rel="noopener noreferrer">
                <Youtube className="h-3 w-3" />
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(problem)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(problem.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleExpanded(
              expandedProblem === problem.id ? null : problem.id
            )}
          >
            {expandedProblem === problem.id ? 'Hide' : 'Show'} Solutions
          </Button>
        </div>
      </div>

      {expandedProblem === problem.id && (
        <DSACodeSolutions
          problemId={problem.id}
          codeSolutions={Array.isArray(problem.code_solutions) ? problem.code_solutions : []}
        />
      )}

      {problem.completed_at && (
        <div className="text-sm text-muted-foreground">
          Completed on {format(new Date(problem.completed_at), 'MMM dd, yyyy')}
        </div>
      )}
    </div>
  );
};