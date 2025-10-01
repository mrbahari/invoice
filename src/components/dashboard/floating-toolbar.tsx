'use client';

import React, { useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useData } from '@/context/data-context';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type FloatingToolbarProps = {
  children?: React.ReactNode;
  className?: string;
  toolbarId: string;
};

export function FloatingToolbar({ children, className, toolbarId }: FloatingToolbarProps) {
  const { data, setData } = useData();
  const draggableToolbarRef = useRef<HTMLDivElement>(null);
  
  const toolbarPosition = data.toolbarPosition[toolbarId] || { x: 50, y: 16 };

  useEffect(() => {
    const handleResize = () => {
      if (!draggableToolbarRef.current) return;

      const { innerWidth, innerHeight } = window;
      const { width: toolbarWidth, height: toolbarHeight } = draggableToolbarRef.current.getBoundingClientRect();

      setData(currentData => {
        let currentPosition = currentData.toolbarPosition[toolbarId] || { x: 50, y: 16 };
        let { x, y } = currentPosition;
        let positionChanged = false;

        if (x < 0) {
          x = 0;
          positionChanged = true;
        } else if (x + toolbarWidth > innerWidth) {
          x = innerWidth - toolbarWidth;
          positionChanged = true;
        }

        if (y < 0) {
          y = 0;
          positionChanged = true;
        } else if (y + toolbarHeight > innerHeight) {
          y = innerHeight - toolbarHeight;
          positionChanged = true;
        }
        
        if (positionChanged) {
          return { 
            ...currentData, 
            toolbarPosition: { 
              ...currentData.toolbarPosition,
              [toolbarId]: { x, y } 
            } 
          };
        }
        
        return currentData;
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [setData, toolbarId]);

  if (!children) {
    return null;
  }

  return (
    <Draggable
      handle=".drag-handle"
      position={toolbarPosition}
      nodeRef={draggableToolbarRef}
      onStop={(e, dragData) => {
        setData(prev => ({ 
          ...prev, 
          toolbarPosition: {
            ...prev.toolbarPosition,
            [toolbarId]: { x: dragData.x, y: dragData.y }
          } 
        }));
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
