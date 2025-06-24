import React, { useEffect, useState, useRef } from 'react';
import useFitText from './useFitText.js';

function getBannerNumber() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('banner') || '1', 10);
}

const Banner = () => {
  const [displayName, setDisplayName] = useState(null);
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [currentSlideSrc, setCurrentSlideSrc] = useState('');
  const [nextSlideSrc, setNextSlideSrc] = useState('');
  const [isNextImageReady, setIsNextImageReady] = useState(false);
  const [isBannerNumberVisible, setBannerNumberVisible] = useState(true);
  const [fontColor, setFontColor] = useState('#8B9091'); // Default font color
  
  const imagesRef = useRef([]); // Create a ref to hold the current images
  const preloadedImagesRef = useRef(new Set()); // Track preloaded images
  const preloadQueueRef = useRef([]); // Priority queue for preloading
  const pendingImageLoadsRef = useRef(new Set()); // Track pending image loads for cleanup

  const bannerNumber = getBannerNumber();
  const { fontSize, ref } = useFitText(displayName?.firstLine);

  // Optimized image preloading with priority queue
  const preloadImage = (src, priority = 0) => {
    if (!src || preloadedImagesRef.current.has(src)) return;
    
    // Add to priority queue
    preloadQueueRef.current.push({ src, priority });
    preloadQueueRef.current.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    // Process queue (limit concurrent preloads to 3)
    const processQueue = () => {
      const processing = preloadQueueRef.current.filter(item => item.processing);
      const pending = preloadQueueRef.current.filter(item => !item.processing);
      
      if (processing.length < 3 && pending.length > 0) {
        const item = pending[0];
        item.processing = true;
        
        const img = new Image();
        // Track this image load for cleanup
        pendingImageLoadsRef.current.add(img);
        
        img.onload = () => {
          preloadedImagesRef.current.add(item.src);
          pendingImageLoadsRef.current.delete(img);
          // Remove from queue
          preloadQueueRef.current = preloadQueueRef.current.filter(q => q.src !== item.src);
        };
        img.onerror = () => {
          pendingImageLoadsRef.current.delete(img);
          // Remove from queue on error
          preloadQueueRef.current = preloadQueueRef.current.filter(q => q.src !== item.src);
        };
        img.src = item.src;
      }
    };
    
    processQueue();
  };

  // Load next image and mark it as ready
  const loadNextImage = (src) => {
    if (!src) {
      setIsNextImageReady(false);
      return;
    }
    
    const img = new Image();
    // Track this image load for cleanup
    pendingImageLoadsRef.current.add(img);
    
    img.onload = () => {
      setNextSlideSrc(src);
      setIsNextImageReady(true);
      pendingImageLoadsRef.current.delete(img);
    };
    img.onerror = () => {
      setIsNextImageReady(false);
      pendingImageLoadsRef.current.delete(img);
    };
    img.src = src;
  };

  // Smart preloading strategy
  const preloadNextImages = (currentIndex, images) => {
    if (!images || images.length === 0) return;
    
    // Clear old preload queue
    preloadQueueRef.current = [];
    
    // Preload current image with highest priority
    preloadImage(images[currentIndex], 10);
    
    // Preload next 3 images with decreasing priority
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (currentIndex + i) % images.length;
      preloadImage(images[nextIndex], 9 - i);
    }
    
    // Preload previous image for wrap-around
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    preloadImage(images[prevIndex], 5);
    
    // For small slideshows, preload all images with low priority
    if (images.length <= 10) {
      images.forEach((img, index) => {
        if (index !== currentIndex && 
            index !== (currentIndex + 1) % images.length &&
            index !== (currentIndex + 2) % images.length &&
            index !== (currentIndex + 3) % images.length &&
            index !== prevIndex) {
          preloadImage(img, 1);
        }
      });
    }
  };

  const fetchImages = async () => {
    const images = await window.electronAPI.invoke('get-slideshow-images');
    setSlideshowImages(images);
    imagesRef.current = images; // Keep the ref in sync with the state

    if (images.length > 0) {
      const index = await window.electronAPI.invoke('get-current-slide-index');
      if (index < images.length) {
        setCurrentSlideSrc(images[index]);
        // Preload images for smooth transitions
        preloadNextImages(index, images);
      }
    } else {
      setCurrentSlideSrc(''); // Clear image if no images
    }
  };

  useEffect(() => {
    fetchImages();
    window.electronAPI.send('renderer-ready');

    // Store cleanup functions
    const cleanupFunctions = [];

    // Register event listeners and store cleanup functions
    const displayNameHandler = (nameData) => setDisplayName(nameData);
    const clearNameHandler = () => setDisplayName(null);
    const bannerNumberVisibilityHandler = (isVisible) => setBannerNumberVisible(isVisible);
    const slideshowUpdatedHandler = () => {
      // Clear preloaded images and queue when slideshow is updated
      preloadedImagesRef.current.clear();
      preloadQueueRef.current = [];
      setIsNextImageReady(false);
      fetchImages();
    };
    const setSlideHandler = (slideIndex) => {
      // Use the ref here to bypass the stale closure and get the latest image list
      const currentImages = imagesRef.current;
      if (currentImages.length > 0 && slideIndex < currentImages.length) {
        const newImageSrc = currentImages[slideIndex];
        
        // Load the new image first
        loadNextImage(newImageSrc);
        
        // Only update current slide when next image is ready
        if (isNextImageReady) {
          setCurrentSlideSrc(newImageSrc);
        }
        
        // Preload next images for smooth transitions
        preloadNextImages(slideIndex, currentImages);
      }
    };
    const setFontColorHandler = (color) => setFontColor(color);
    const clearSlideshowHandler = () => {
      setCurrentSlideSrc('');
      setNextSlideSrc('');
      setIsNextImageReady(false);
      
      // Cancel all pending image loads
      pendingImageLoadsRef.current.forEach(img => {
        img.src = ''; // Cancel the load
      });
      pendingImageLoadsRef.current.clear();
      
      // Clear preloaded images and queue
      preloadedImagesRef.current.clear();
      preloadQueueRef.current = [];
      
      // Clear any pending image loads
      if (imagesRef.current) {
        imagesRef.current = [];
      }
      console.log('[Banner] Slideshow cleared and all resources cleaned up');
    };

    // Register listeners
    window.electronAPI.on('display-name', displayNameHandler);
    window.electronAPI.on('clear-name', clearNameHandler);
    window.electronAPI.on('set-banner-number-visibility', bannerNumberVisibilityHandler);
    window.electronAPI.on('slideshow-updated', slideshowUpdatedHandler);
    window.electronAPI.on('set-slide', setSlideHandler);
    window.electronAPI.on('set-font-color', setFontColorHandler);
    window.electronAPI.on('clear-slideshow', clearSlideshowHandler);

    // Return cleanup function
    return () => {
      // Remove all event listeners to prevent memory leaks
      window.electronAPI.removeAllListeners('display-name');
      window.electronAPI.removeAllListeners('clear-name');
      window.electronAPI.removeAllListeners('set-banner-number-visibility');
      window.electronAPI.removeAllListeners('slideshow-updated');
      window.electronAPI.removeAllListeners('set-slide');
      window.electronAPI.removeAllListeners('set-font-color');
      window.electronAPI.removeAllListeners('clear-slideshow');
      
      // Cancel all pending image loads
      pendingImageLoadsRef.current.forEach(img => {
        img.src = ''; // Cancel the load
      });
      pendingImageLoadsRef.current.clear();
      
      // Clear preload cache and queue
      preloadedImagesRef.current.clear();
      preloadQueueRef.current = [];
    };
  }, []);

  // Update current slide when next image is ready
  useEffect(() => {
    if (isNextImageReady && nextSlideSrc && nextSlideSrc !== currentSlideSrc) {
      setCurrentSlideSrc(nextSlideSrc);
      setIsNextImageReady(false);
    }
  }, [isNextImageReady, nextSlideSrc, currentSlideSrc]);

  return (
    <div className="banner-container">
      {isBannerNumberVisible && <div className="banner-header">Banner {bannerNumber}</div>}
      {displayName ? (
        <div className="name-display">
          <div 
            ref={ref} 
            className="first-name" 
            style={{ 
              fontSize: `${fontSize}px`,
              color: fontColor
            }}
          >
            {displayName.firstLine}
          </div>
          <div 
            className="last-name"
            style={{ color: fontColor }}
          >
            {displayName.secondLine}
          </div>
        </div>
      ) : (
        slideshowImages.length > 0 ? (
          <img 
            key={currentSlideSrc} 
            src={currentSlideSrc} 
            className="slideshow-image" 
            alt="Slideshow"
            style={{ 
              opacity: currentSlideSrc ? 1 : 0,
              transition: 'opacity 0.05s ease-in-out'
            }}
          />
        ) : (
          <p className="waiting-text" style={{ color: fontColor }}>Waiting for name display...</p>
        )
      )}
    </div>
  );
};

export default Banner;