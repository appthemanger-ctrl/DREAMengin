import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LiveKitRoom } from '@livekit/components-react';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <LiveKitRoom>
      <App />
    </LiveKitRoom>
  </React.StrictMode>
);