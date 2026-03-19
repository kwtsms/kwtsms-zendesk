import React, { useEffect, useState } from 'react';
import { Button } from '@zendeskgarden/react-buttons';
import { Toggle, Field, Label, Select } from '@zendeskgarden/react-forms';
import { useApi } from '../hooks/useApi';
import GatewayStatus from '../components/GatewayStatus';
import LoginForm from '../components/LoginForm';

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid #f3f4f5',
    }}>
      <div>
        <div style={{ fontSize: '13px', color: '#2f3941' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#87929d' }}>{description}</div>
      </div>
      <Field>
        <Toggle checked={checked} onChange={(e) => onChange(e.target.checked)}>
          <Label hidden>{label}</Label>
        </Toggle>
      </Field>
    </div>
  );
}

export default function Settings() {
  const { get, put, post } = useApi();
  const [settings, setSettings] = useState(null);
  const [senderIds, setSenderIds] = useState([]);
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const s = await get('/api/settings');
      setSettings(s);
      if (s.is_connected) {
        const sids = await get('/api/senderids');
        setSenderIds(sids);
      }
    } catch (err) {
      console.error('Settings fetch failed:', err);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleLogin = async (username, password) => {
    setLoginLoading(true);
    try {
      await post('/api/auth/login', { username, password });
      await fetchSettings();
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await post('/api/auth/logout');
    setSettings((prev) => ({ ...prev, is_connected: false }));
    setSenderIds([]);
  };

  const handleToggle = async (key, value) => {
    await put('/api/settings', { key, value });
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSenderIdChange = async (e) => {
    const value = e.target.value;
    await put('/api/settings', { key: 'sender_id', value });
    setSettings((prev) => ({ ...prev, sender_id: value }));
  };

  if (!settings) return <p style={{ padding: '16px', color: '#87929d' }}>Loading...</p>;

  return (
    <div>
      <GatewayStatus
        isConnected={settings.is_connected}
        balance={settings.balance}
        testMode={settings.test_mode}
      />

      {!settings.is_connected ? (
        <LoginForm onLogin={handleLogin} loading={loginLoading} />
      ) : (
        <>
          <div style={{
            background: 'white', borderRadius: '8px', padding: '20px',
            border: '1px solid #d8dcde', marginBottom: '12px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#2f3941' }}>kwtsms Gateway</h3>
            <div style={{ marginBottom: '16px' }}>
              <Button isDanger onClick={handleLogout}
                style={{ background: '#cc3340', color: 'white', borderColor: '#cc3340' }}>
                Logout
              </Button>
            </div>
            <Field>
              <Label>Sender ID</Label>
              <Select value={settings.sender_id} onChange={handleSenderIdChange}>
                <option value="">Select SenderID</option>
                {senderIds.map((sid) => (
                  <option key={sid.name} value={sid.name}>{sid.name}</option>
                ))}
              </Select>
              <p style={{ fontSize: '11px', color: '#87929d', marginTop: '4px' }}>
                Fetched from your kwtsms account
              </p>
            </Field>
          </div>

          <div style={{
            background: 'white', borderRadius: '8px', padding: '20px',
            border: '1px solid #d8dcde',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#2f3941' }}>General</h3>
            <SettingToggle
              label="Enable SMS Gateway" description="Master switch for all SMS sending"
              checked={settings.is_enabled}
              onChange={(val) => handleToggle('is_enabled', val)}
            />
            <SettingToggle
              label="Test Mode" description="Send with test=1 (credits recoverable)"
              checked={settings.test_mode}
              onChange={(val) => handleToggle('test_mode', val)}
            />
            <SettingToggle
              label="Debug Logging" description="Verbose logs for troubleshooting"
              checked={settings.debug_logging}
              onChange={(val) => handleToggle('debug_logging', val)}
            />
          </div>
        </>
      )}
    </div>
  );
}
