import React from 'react';
import { Tag } from '@zendeskgarden/react-tags';

export default function GatewayStatus({ isConnected, balance, testMode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
      background: isConnected ? '#edf8f0' : '#fef0ef',
      border: `1px solid ${isConnected ? '#c4e8d1' : '#f5c6c6'}`,
    }}>
      <span style={{ color: isConnected ? '#2d6a4f' : '#cc3340', fontSize: '1.2rem' }}>
        &#9679;
      </span>
      <span style={{
        fontSize: '0.85rem', fontWeight: 600,
        color: isConnected ? '#2d6a4f' : '#cc3340',
      }}>
        {isConnected ? 'Connected' : 'Not Connected'}
      </span>
      {isConnected && (
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#68737d' }}>
          Balance: {balance} KWD
          {testMode && <Tag size="small" style={{ marginLeft: '8px' }}>Test Mode</Tag>}
        </span>
      )}
    </div>
  );
}
