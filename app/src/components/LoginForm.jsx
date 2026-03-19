import React, { useState } from 'react';
import { Button } from '@zendeskgarden/react-buttons';
import { Field, Label, Input } from '@zendeskgarden/react-forms';

export default function LoginForm({ onLogin, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    try {
      await onLogin(username, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: 'white', borderRadius: '8px', padding: '20px',
        border: '1px solid #d8dcde',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#2f3941' }}>
          kwtsms Gateway Login
        </h3>
        <Field style={{ marginBottom: '12px' }}>
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter kwtsms username"
          />
        </Field>
        <Field style={{ marginBottom: '16px' }}>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter kwtsms password"
          />
        </Field>
        {error && (
          <p style={{ color: '#cc3340', fontSize: '12px', margin: '0 0 12px' }}>{error}</p>
        )}
        <Button isPrimary disabled={loading} type="submit"
          style={{ background: '#FFA200', borderColor: '#FFA200' }}>
          {loading ? 'Connecting...' : 'Login'}
        </Button>
        <p style={{ fontSize: '11px', color: '#87929d', marginTop: '12px' }}>
          Verifies credentials via kwtsms API, then fetches SenderIDs and coverage.
        </p>
      </div>
    </form>
  );
}
