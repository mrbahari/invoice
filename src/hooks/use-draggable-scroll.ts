
'use client';

import { useRef, useCallback, type RefObject, useEffect } from 'react';

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
    (e: MouseEvent) => {
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
    isDragging.current = false;
    if (ref.current) {
        ref.current.style.cursor = 'grab';
    }
  }, [ref]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
     if (ref.current) {
        ref.current.style.cursor = 'grab';
    }
  }, [ref]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
    [ref, options.direction]
  );
  
    // Add effect to clean up cursor on unmount
    useEffect(() => {
        const currentRef = ref.current;
        if (currentRef) {
          currentRef.addEventListener('mousedown', handleMouseDown as EventListener);
          currentRef.addEventListener('mouseleave', handleMouseLeave);
          currentRef.addEventListener('mouseup', handleMouseUp);
          currentRef.addEventListener('mousemove', handleMouseMove as EventListener);
        }

        return () => {
             if (currentRef) {
                currentRef.removeEventListener('mousedown', handleMouseDown as EventListener);
                currentRef.removeEventListener('mouseleave', handleMouseLeave);
                currentRef.removeEventListener('mouseup', handleMouseUp);
                currentRef.removeEventListener('mousemove', handleMouseMove as EventListener);
            }
        };
    }, [ref, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove]);

  return { ref };
}
