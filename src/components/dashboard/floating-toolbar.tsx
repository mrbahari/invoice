
'use client';

import React, { useRef, useEffect } from 'react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useData } from '@/context/data-context';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolbarPosition } from '@/lib/definitions';

type FloatingToolbarProps = {
  children?: React.ReactNode;
  className?: string;
  pageKey: string;
};

const defaultPosition = { x: 20, y: 80 };

export function FloatingToolbar({ children, className, pageKey }: FloatingToolbarProps) {
  const { data, setData } = useData();
  const { toolbarPositions } = data;
  const draggableToolbarRef = useRef<HTMLDivElement>(null);
  
  const currentPosition = toolbarPositions?.[pageKey] || defaultPosition;
  
  const headerHeight = 80;
  const footerHeight = 80;

  useEffect(() => {
    const handleResize = () => {
      if (!draggableToolbarRef.current) return;

      const { innerWidth, innerHeight } = window;
      const { width: toolbarWidth, height: toolbarHeight } = draggableToolbarRef.current.getBoundingClientRect();
      const position = data.toolbarPositions?.[pageKey] || defaultPosition;
      
      let { x, y } = position;
      let positionChanged = false;

      if (x < 0) { x = 0; positionChanged = true; }
      if (x + toolbarWidth > innerWidth) { x = innerWidth - toolbarWidth; positionChanged = true; }
      if (y < headerHeight) { y = headerHeight; positionChanged = true; }
      if (y + toolbarHeight > innerHeight - footerHeight) { y = innerHeight - footerHeight - toolbarHeight; positionChanged = true; }
      
      if (positionChanged) {
        setData(currentData => ({
          ...currentData,
          toolbarPositions: {
            ...currentData.toolbarPositions,
            [pageKey]: { x, y }
          }
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [data.toolbarPositions, pageKey, setData]);

  const handleStop = (e: DraggableEvent, dragData: DraggableData) => {
    const { innerHeight } = window;
    let y = dragData.y;
    
    if (y < headerHeight) {
      y = headerHeight;
    } else if (y + dragData.node.clientHeight > innerHeight - footerHeight) {
      y = innerHeight - footerHeight - dragData.node.clientHeight;
    }

    setData(prev => ({
        ...prev,
        toolbarPositions: {
            ...prev.toolbarPositions,
            [pageKey]: { x: dragData.x, y }
        }
    }));
  };

  if (!children) {
    return null;
  }

  return (
    <Draggable
      handle=".drag-handle"
      position={currentPosition}
      nodeRef={draggableToolbarRef}
      onStop={handleStop}
      bounds={{ top: headerHeight, bottom: (typeof window !== 'undefined' ? window.innerHeight : 800) - (draggableToolbarRef.current?.clientHeight || 0) - footerHeight, left: 0, right: (typeof window !== 'undefined' ? window.innerWidth : 600) - (draggableToolbarRef.current?.clientWidth || 0) }}
    >
      <div
        ref={draggableToolbarRef}
        className="fixed z-40 no-print"
        style={{ top: 0, left: 0 }} // Position is controlled by Draggable
      >
        <div
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 bg-card/90 border rounded-lg shadow-lg backdrop-blur-sm",
            className
          )}
        >
          {children}
          <div className="drag-handle cursor-move p-2 -mb-1 -mx-1 rounded-b-md hover:bg-muted">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Draggable>
  );
}
