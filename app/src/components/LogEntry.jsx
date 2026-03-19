import React, { useState } from 'react';
import { Tag } from '@zendeskgarden/react-tags';

const STATUS_COLORS = { sent: 'green', failed: 'red', skipped: 'blue' };

export default function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(log.created_at).toLocaleTimeString();

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 120px 60px',
        padding: '8px 12px', borderBottom: '1px solid #f3f4f5',
        cursor: 'pointer', fontSize: '13px', alignItems: 'center',
      }}
    >
      <span style={{ color: '#87929d' }}>{time}</span>
      <span style={{ color: '#2f3941' }}>
        Ticket #{log.ticket_id} {log.event_type?.split('.').pop()}
      </span>
      <span style={{ fontFamily: 'monospace', color: '#49545c' }}>{log.recipient_phone}</span>
      <Tag size="small" hue={STATUS_COLORS[log.status] || 'grey'}>
        {log.status}
      </Tag>
      {expanded && (
        <div style={{
          gridColumn: '1 / -1', marginTop: '8px', padding: '8px',
          background: '#f8f9f9', borderRadius: '4px', fontSize: '12px',
        }}>
          <div><strong>Message:</strong> {log.message_body}</div>
          {log.error_message && <div style={{ color: '#cc3340' }}><strong>Error:</strong> {log.error_message}</div>}
          <div><strong>API Response:</strong> <code>{log.api_response}</code></div>
        </div>
      )}
    </div>
  );
}
