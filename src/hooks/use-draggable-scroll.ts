
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
      ref.current.style.userSelect = 'none'; // Prevent text selection
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
    if (isDragging.current) {
        isDragging.current = false;
        if (ref.current) {
            ref.current.style.cursor = 'grab';
            ref.current.style.userSelect = 'auto';
        }
    }
  }, [ref]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
     if (ref.current) {
        ref.current.style.cursor = 'grab';
        ref.current.style.userSelect = 'auto';
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
          currentRef.style.cursor = 'grab';
          currentRef.addEventListener('mousedown', handleMouseDown as EventListener);
          // Use document/window for mouseup/mouseleave to handle cases where the cursor leaves the element while dragging
          document.addEventListener('mouseup', handleMouseUp);
          document.addEventListener('mousemove', handleMouseMove as EventListener);
          currentRef.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
             if (currentRef) {
                currentRef.removeEventListener('mousedown', handleMouseDown as EventListener);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('mousemove', handleMouseMove as EventListener);
                currentRef.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [ref, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove]);

  return { ref, isDragging: isDragging.current };
}

    