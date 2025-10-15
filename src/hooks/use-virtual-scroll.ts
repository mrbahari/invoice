
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook for implementing virtual/infinite scrolling.
 * It observes a "sentinel" element at the end of a list and increases
 * the number of items to show when the sentinel becomes visible.
 *
 * @param {number} [increment=20] - The number of items to add each time the end is reached.
 * @returns {{
 *   itemsToShow: number;
 *   sentinelRef: (node?: Element | null | undefined) => void;
 * }} An object containing the number of items to display and a ref to attach to the sentinel element.
 */
export function useVirtualScroll(increment: number = 20) {
  const [itemsToShow, setItemsToShow] = useState(increment);
  const observer = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((node: Element | null) => {
    // If there's an old observer, disconnect it
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create a new IntersectionObserver
    observer.current = new IntersectionObserver(entries => {
      // If the sentinel element is intersecting (i.e., is visible)
      if (entries[0].isIntersecting) {
        // Increase the number of items to show
        setItemsToShow(prevItems => prevItems + increment);
      }
    });

    // If the node (the sentinel element) exists, start observing it
    if (node) {
      observer.current.observe(node);
    }
  }, [increment]);

  return { itemsToShow, sentinelRef };
}
