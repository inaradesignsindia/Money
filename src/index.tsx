
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorProvider } from './contexts/ErrorContext.tsx';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <ErrorProvider>
                <App />
            </ErrorProvider>
        </React.StrictMode>
    );
} else {
    console.error('Root container not found');
}
