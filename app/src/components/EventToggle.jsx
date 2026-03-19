import React from 'react';
import { Toggle, Field, Label } from '@zendeskgarden/react-forms';

export default function EventToggle({ eventType, label, isEnabled, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid #f3f4f5',
    }}>
      <span style={{ fontSize: '13px', color: '#2f3941' }}>{label}</span>
      <Field>
        <Toggle checked={isEnabled} onChange={(e) => onChange(eventType, e.target.checked)}>
          <Label hidden>{label}</Label>
        </Toggle>
      </Field>
    </div>
  );
}
