'use client';

import React, { useState } from 'react';
import GameEngin from './GameEngin';

/**
 * GameEngin Demo wrapper component
 *
 * Allows switching between the two demo games:
 * - Neon Drift (cyberpunk endless racer)
 * - Echo Arena (top-down arena shooter)
 */
export default function GameEnginDemo() {
  const [projectId, setProjectId] = useState<'neon-drift' | 'echo-arena'>('neon-drift');
  const [ready, setReady] = useState(false);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '16px',
            borderRadius: '8px',
            color: '#fff',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#0ff',
            }}
          >
            Select Game
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setProjectId('neon-drift')}
              style={{
                padding: '10px 16px',
                background: projectId === 'neon-drift' ? '#0ff' : '#333',
                color: projectId === 'neon-drift' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              🏎️ Neon Drift (Racer)
            </button>
            <button
              onClick={() => setProjectId('echo-arena')}
              style={{
                padding: '10px 16px',
                background: projectId === 'echo-arena' ? '#0ff' : '#333',
                color: projectId === 'echo-arena' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              🎯 Echo Arena (Shooter)
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '16px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            lineHeight: '1.6',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0ff',
            }}
          >
            Controls
          </h3>
          {projectId === 'neon-drift' ? (
            <div>
              <p><strong>Neon Drift:</strong></p>
              <p>• R2 Trigger: Accelerate</p>
              <p>• Left Stick / Gyro: Steer</p>
              <p>• High speed triggers rumble</p>
            </div>
          ) : (
            <div>
              <p><strong>Echo Arena:</strong></p>
              <p>• Left Stick: Move</p>
              <p>• Right Stick / Gyro: Aim</p>
              <p>• R2 Trigger: Shoot</p>
            </div>
          )}
          <p style={{ marginTop: '12px', color: '#888' }}>
            📱 Pair DualSense: Hold PS + Create until flashing
          </p>
        </div>
      </div>

      <GameEngin
        projectId={projectId}
        dreamWindowId="demo-window"
        onReady={() => setReady(true)}
        onError={(error) => console.error('GameEngin error:', error)}
      />
    </div>
  );
}
