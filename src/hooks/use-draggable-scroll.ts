
'use client';

import { useRef, useState, useCallback, RefObject } from 'react';

export function useDraggableScroll(
  ref: RefObject<HTMLElement>,
  options: {
    direction: 'horizontal' | 'vertical';
  } = { direction: 'horizontal' }
) {
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const scrollPos = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      isDragging.current = true;
      ref.current.style.cursor = 'grabbing';
      if (options.direction === 'horizontal') {
        startPos.current = e.pageX - ref.current.offsetLeft;
        scrollPos.current = ref.current.scrollLeft;
      } else {
        startPos.current = e.pageY - ref.current.offsetTop;
        scrollPos.current = ref.current.scrollTop;
      }
    },
    [ref, options.direction]
  );

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
        ref.current.style.cursor = 'grab';
    }
    isDragging.current = false;
  }, [ref]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
     if (ref.current) {
        ref.current.style.cursor = 'grab';
    }
  }, [ref]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || !ref.current) return;
      e.preventDefault();
      if (options.direction === 'horizontal') {
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startPos.current) * 2; // The multiplier makes scrolling faster
        ref.current.scrollLeft = scrollPos.current - walk;
      } else {
        const y = e.pageY - ref.current.offsetTop;
        const walk = (y - startPos.current) * 2;
        ref.current.scrollTop = scrollPos.current - walk;
      }
    },
    [ref, options.direction, startPos, scrollPos]
  );

  return {
    events: {
      onMouseDown: handleMouseDown,
      onMouseLeave: handleMouseLeave,
      onMouseUp: handleMouseUp,
      onMouseMove: handleMouseMove,
    },
  };
}
