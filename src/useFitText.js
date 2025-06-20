import { useLayoutEffect, useState, useRef } from 'react';

// Cache for font size calculations to avoid recalculation
const fontSizeCache = new Map();

const useFitText = (text) => {
  const [fontSize, setFontSize] = useState(175); // Default max font size
  const [ref, setRef] = useState(null);
  const lastTextRef = useRef('');
  const lastWidthRef = useRef(0);

  useLayoutEffect(() => {
    if (!ref || !text) {
      return;
    }

    const parent = ref.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    const cacheKey = `${text}-${parentWidth}`;

    // Check cache first
    if (fontSizeCache.has(cacheKey)) {
      setFontSize(fontSizeCache.get(cacheKey));
      return;
    }

    // Only recalculate if text or container width changed
    if (lastTextRef.current === text && lastWidthRef.current === parentWidth) {
      return;
    }

    lastTextRef.current = text;
    lastWidthRef.current = parentWidth;

    // Binary search for optimal font size (much faster than linear search)
    let minSize = 10;
    let maxSize = 175;
    let optimalSize = 175;

    while (minSize <= maxSize) {
      const midSize = Math.floor((minSize + maxSize) / 2);
      ref.style.fontSize = `${midSize}px`;

      if (ref.scrollWidth <= parentWidth) {
        optimalSize = midSize;
        minSize = midSize + 1;
      } else {
        maxSize = midSize - 1;
      }
    }

    // Cache the result
    fontSizeCache.set(cacheKey, optimalSize);
    setFontSize(optimalSize);

    // Clean up cache if it gets too large (keep only last 100 entries)
    if (fontSizeCache.size > 100) {
      const entries = Array.from(fontSizeCache.entries());
      fontSizeCache.clear();
      entries.slice(-50).forEach(([key, value]) => fontSizeCache.set(key, value));
    }

  }, [ref, text]);

  return { fontSize, ref: setRef };
};

export default useFitText; 