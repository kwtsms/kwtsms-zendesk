import React, { useState } from 'react';
import { Button } from '@zendeskgarden/react-buttons';
import { Textarea } from '@zendeskgarden/react-forms';
import { Tag } from '@zendeskgarden/react-tags';

const PLACEHOLDERS = [
  '{{requester.name}}', '{{ticket.id}}', '{{ticket.subject}}',
  '{{status}}', '{{agent.name}}', '{{company.name}}',
];

export default function TemplateCard({ template, onSave }) {
  const [body, setBody] = useState(template.body);
  const [dirty, setDirty] = useState(false);

  const handleChange = (e) => {
    setBody(e.target.value);
    setDirty(true);
  };

  const handleSave = async () => {
    await onSave(template.id, body);
    setDirty(false);
  };

  const insertPlaceholder = (ph) => {
    setBody((prev) => prev + ph);
    setDirty(true);
  };

  return (
    <div style={{
      background: 'white', borderRadius: '8px', padding: '16px',
      border: '1px solid #d8dcde', marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#2f3941' }}>
          {template.subject}
        </span>
        <Tag size="small" hue={template.is_active ? 'green' : 'yellow'}>
          {template.is_active ? 'Active' : 'Inactive'}
        </Tag>
      </div>
      <Textarea
        value={body}
        onChange={handleChange}
        rows={3}
        style={{ fontFamily: 'monospace', fontSize: '13px' }}
      />
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
        {PLACEHOLDERS.map((ph) => (
          <Tag key={ph} size="small" isPill onClick={() => insertPlaceholder(ph)}
            style={{ cursor: 'pointer' }}>
            {ph}
          </Tag>
        ))}
      </div>
      {dirty && (
        <Button size="small" isPrimary onClick={handleSave} style={{ marginTop: '8px' }}>
          Save
        </Button>
      )}
    </div>
  );
}
