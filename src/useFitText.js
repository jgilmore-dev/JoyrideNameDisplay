import { useLayoutEffect, useState } from 'react';

const useFitText = (text) => {
  const [fontSize, setFontSize] = useState(175); // Default max font size
  const [ref, setRef] = useState(null);

  useLayoutEffect(() => {
    if (!ref || !text) {
      return;
    }

    const parent = ref.parentElement;
    if (!parent) return;

    // Start with max font size and scale down
    let currentSize = 175;
    ref.style.fontSize = `${currentSize}px`;

    // Check if text is overflowing
    while (ref.scrollWidth > parent.clientWidth && currentSize > 10) {
      currentSize--;
      ref.style.fontSize = `${currentSize}px`;
    }

    setFontSize(currentSize);

  }, [ref, text]);

  return { fontSize, ref: setRef };
};

export default useFitText; 