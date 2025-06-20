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
  const [isBannerNumberVisible, setBannerNumberVisible] = useState(true);
  
  const imagesRef = useRef([]); // Create a ref to hold the current images

  const bannerNumber = getBannerNumber();
  const { fontSize, ref } = useFitText(displayName?.firstLine);

  const fetchImages = async () => {
    const images = await window.electronAPI.invoke('get-slideshow-images');
    setSlideshowImages(images);
    imagesRef.current = images; // Keep the ref in sync with the state

    if (images.length > 0) {
      const index = await window.electronAPI.invoke('get-current-slide-index');
      if (index < images.length) {
        setCurrentSlideSrc(images[index]);
      }
    } else {
      setCurrentSlideSrc(''); // Clear image if no images
    }
  };

  useEffect(() => {
    fetchImages();
    window.electronAPI.send('renderer-ready');

    window.electronAPI.on('display-name', (nameData) => setDisplayName(nameData));
    window.electronAPI.on('clear-name', () => setDisplayName(null));
    window.electronAPI.on('set-banner-number-visibility', (isVisible) => setBannerNumberVisible(isVisible));
    window.electronAPI.on('slideshow-updated', () => fetchImages());
    window.electronAPI.on('set-slide', (slideIndex) => {
      // Use the ref here to bypass the stale closure and get the latest image list
      const currentImages = imagesRef.current;
      if (currentImages.length > 0 && slideIndex < currentImages.length) {
        setCurrentSlideSrc(currentImages[slideIndex]);
      }
    });
  }, []);

  return (
    <div className="banner-container">
      {isBannerNumberVisible && <div className="banner-header">Banner {bannerNumber}</div>}
      {displayName ? (
        <div className="name-display">
          <div ref={ref} className="first-name" style={{ fontSize: `${fontSize}px` }}>{displayName.firstLine}</div>
          <div className="last-name">{displayName.secondLine}</div>
        </div>
      ) : (
        slideshowImages.length > 0 ? (
          <img key={currentSlideSrc} src={currentSlideSrc} className="slideshow-image" alt="Slideshow" />
        ) : (
          <p className="waiting-text">Waiting for name display...</p>
        )
      )}
    </div>
  );
};

export default Banner;