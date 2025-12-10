import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

/**
 * React Query Client Configuration
 * 
 * Architecture Note: These settings are optimized for the polling strategy.
 * - staleTime: How long data is considered fresh
 * - retry: Number of retries on failure (with exponential backoff)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5 seconds
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a26',
              color: '#f3f4f6',
              border: '1px solid #00f5ff',
              boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)',
            },
            success: {
              iconTheme: {
                primary: '#39ff14',
                secondary: '#1a1a26',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff3131',
                secondary: '#1a1a26',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

