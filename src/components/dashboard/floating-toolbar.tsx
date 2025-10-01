'use client';

import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { useData } from '@/context/data-context';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type FloatingToolbarProps = {
  children?: React.ReactNode;
  className?: string;
};

export function FloatingToolbar({ children, className }: FloatingToolbarProps) {
  const { data, setData } = useData();
  const { toolbarPosition } = data;
  const draggableToolbarRef = useRef(null);

  if (!children) {
    return null;
  }

  return (
    <Draggable
      handle=".drag-handle"
      position={toolbarPosition}
      nodeRef={draggableToolbarRef}
      onStop={(e, dragData) => {
        setData(prev => ({ ...prev, toolbarPosition: { x: dragData.x, y: dragData.y } }));
      }}
    >
      <div
        ref={draggableToolbarRef}
        className="fixed z-40 no-print"
        style={{ top: 0, left: 0 }} // Position is controlled by Draggable
      >
        <div
          className={cn(
            "flex items-center gap-2 p-2 bg-card/90 border rounded-lg shadow-lg backdrop-blur-sm",
            className
          )}
        >
          <div className="drag-handle cursor-move p-2 -ml-2 -my-2 rounded-l-md hover:bg-muted">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {children}
        </div>
      </div>
    </Draggable>
  );
}
