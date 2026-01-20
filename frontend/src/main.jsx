/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RÉSIDENCE - Point d'entrée React
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { AuthProvider } from '@contexts/AuthContext';
import { FavoritesProvider } from '@contexts/FavoritesContext';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#000',
                color: '#fff',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1rem',
                padding: '1rem 1.5rem',
                borderRadius: '4px',
              },
              success: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#000',
                },
              },
            }}
          />
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
