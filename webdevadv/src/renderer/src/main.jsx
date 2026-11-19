import './assets/main.css';

import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
import Management from './Management';
import Error404 from './Error404'

createRoot(document.getElementById('root')).render(
  
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/management" element={<Management />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
