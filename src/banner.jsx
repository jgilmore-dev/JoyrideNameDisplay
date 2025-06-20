import React, { useEffect, useState } from 'react';
import useFitText from './useFitText.js';

function getBannerNumber() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('banner') || '1', 10);
}

const Banner = () => {
  const [displayName, setDisplayName] = useState(null);
  const bannerNumber = getBannerNumber();
  const { fontSize, ref } = useFitText(displayName?.firstLine);

  useEffect(() => {
    // This check is important because the preload script might not be available in all contexts (like testing).
    if (window.electronAPI) {
      window.electronAPI.on('display-name', (nameData) => {
        setDisplayName(nameData);
      });
      window.electronAPI.on('clear-name', () => {
        setDisplayName(null);
      });
    }
  }, []);

  return (
    <div className="banner-container">
      <div className="banner-header">Banner {bannerNumber}</div>
      {displayName ? (
        <div className="name-display">
          <div
            ref={ref}
            className="first-name"
            style={{ fontSize: `${fontSize}px` }}
          >
            {displayName.firstLine}
          </div>
          <div className="last-name">{displayName.secondLine}</div>
        </div>
      ) : (
        <p className="waiting-text">Waiting for name display...</p>
      )}
    </div>
  );
};

export default Banner; 