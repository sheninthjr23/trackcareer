import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DropZoneData {
  type: 'folder' | 'live-section' | 'topic-filter' | 'level-filter' | 'completed-section' | 'pending-section';
  folderId?: string;
  topic?: string;
  level?: string;
}

interface DroppableZoneProps {
  id: string;
  data: DropZoneData;
  children: React.ReactNode;
  className?: string;
}

export const DroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  data,
  children,
  className = '',
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      dropZone: data,
    },
  });

  const dropIndicatorClass = isOver ? 'bg-primary/10 border-primary border-2 border-dashed' : '';

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${dropIndicatorClass} transition-colors duration-200`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
            Drop here to update
          </div>
        </div>
      )}
    </div>
  );
};