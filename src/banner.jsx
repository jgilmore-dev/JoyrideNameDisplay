import React, { useEffect, useState } from 'react';

function getBannerNumber() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('banner') || '1', 10);
}

const Banner = () => {
  const [displayName, setDisplayName] = useState(null);
  const bannerNumber = getBannerNumber();

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#222', color: '#fff' }}>
      <h1 style={{ fontSize: 64 }}>Banner {bannerNumber}</h1>
      {displayName ? (
        <>
          <div style={{ fontSize: 72, fontWeight: 'bold' }}>{displayName.firstLine}</div>
          <div style={{ fontSize: 48 }}>{displayName.secondLine}</div>
        </>
      ) : (
        <p style={{ fontSize: 24 }}>Waiting for name display...</p>
      )}
    </div>
  );
};

export default Banner; 