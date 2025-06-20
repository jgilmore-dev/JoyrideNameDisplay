import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Banner from './banner.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Banner />); 