import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import GatewayStatus from '../components/GatewayStatus';
import EventToggle from '../components/EventToggle';

function StatCard({ label, value, unit, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: '8px', padding: '16px',
      border: '1px solid #d8dcde', textAlign: 'center',
    }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#87929d', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: color || '#2f3941', margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#87929d' }}>{unit}</div>
    </div>
  );
}

export default function Dashboard() {
  const { get, put } = useApi();
  const [data, setData] = useState(null);

  const fetchDashboard = async () => {
    try {
      const result = await get('/api/dashboard');
      setData(result);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleToggle = async (eventType, enabled) => {
    try {
      await put(`/api/events/${eventType}`, { is_enabled: enabled });
      fetchDashboard();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  if (!data) return <p style={{ padding: '16px', color: '#87929d' }}>Loading...</p>;

  return (
    <div>
      <GatewayStatus
        isConnected={data.is_connected}
        balance={data.balance}
        testMode={data.test_mode}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard label="Balance" value={data.balance} unit="KWD" />
        <StatCard label="Sent Today" value={data.sent_today} unit="messages" />
        <StatCard label="Failed" value={data.failed_24h} unit="last 24h"
          color={data.failed_24h > 0 ? '#cc3340' : undefined} />
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #d8dcde' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '13px', color: '#2f3941' }}>SMS Event Toggles</h3>
        {(data.toggles || []).map((t) => (
          <EventToggle
            key={t.event_type}
            eventType={t.event_type}
            label={t.label || t.event_type}
            isEnabled={t.is_enabled}
            onChange={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
