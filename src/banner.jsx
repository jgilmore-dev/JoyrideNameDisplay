import React from 'react';

const Banner = ({ bannerNumber = 1 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#222', color: '#fff' }}>
    <h1 style={{ fontSize: 64 }}>Banner {bannerNumber}</h1>
    <p style={{ fontSize: 24 }}>Waiting for name display...</p>
  </div>
);

export default Banner; 