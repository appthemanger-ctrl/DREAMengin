'use client';
import { useEffect, useState } from 'react';
import { bridge, type PeerState } from '@/lib/runtime/dualRuntimeBridge';

interface Props {
  excludeChannel?: string;
  statusOverrides?: Record<string, string>;
}

export function CrossEnginStatusPanel({ excludeChannel, statusOverrides }: Props) {
  const [peers, setPeers] = useState<readonly PeerState[]>([]);

  useEffect(() => {
    return bridge.subscribePeerActivity(setPeers);
  }, []);

  return (
    <div className="de-widget-grid"> 
      {peers
        .filter(peer => peer.channel !== excludeChannel)
        .map(peer => {
          const isLive = peer.subscriberCount > 0 ||
            (peer.lastActivityAt !== null && Date.now() - peer.lastActivityAt < 60_000);
          
          const statusText = statusOverrides?.[peer.channel] || (isLive ? '● Live' : '● Idle');
          
          return (
            <div key={peer.channel} className="de-widget-card flex justify-between p-2">
              <span className="capitalize text-xs font-medium">{peer.channel}</span>
              <span style={{ color: isLive ? '#22c55e' : '#64748b' }} className="text-xs">
                {statusText}
              </span>
            </div>
          );
        })}
    </div>
  );
}
