import React, { useEffect, useState } from 'react';
import { Button } from '@zendeskgarden/react-buttons';
import { Select, Field } from '@zendeskgarden/react-forms';
import { useApi } from '../hooks/useApi';
import LogEntry from '../components/LogEntry';

export default function Logs() {
  const { get, del } = useApi();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchLogs = async (page = 1) => {
    try {
      let url = `/api/logs?page=${page}`;
      if (filterEvent) url += `&event_type=${filterEvent}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const result = await get(url);
      setLogs(result.logs || []);
      setPagination(result.pagination || {});
    } catch (err) {
      console.error('Logs fetch failed:', err);
    }
  };

  useEffect(() => { fetchLogs(); }, [filterEvent, filterStatus]);

  const handleClear = async () => {
    if (confirm('Clear all logs? This cannot be undone.')) {
      await del('/api/logs');
      setLogs([]);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <Field style={{ flex: 1 }}>
          <Select compact value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
            <option value="">All Events</option>
            <option value="ticket.created">Ticket Created</option>
            <option value="ticket.status.open">Ticket Opened</option>
            <option value="ticket.status.pending">Ticket Pending</option>
            <option value="ticket.status.solved">Ticket Solved</option>
            <option value="ticket.assigned">Assigned</option>
            <option value="ticket.comment.public">Agent Reply</option>
          </Select>
        </Field>
        <Field style={{ flex: 1 }}>
          <Select compact value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </Select>
        </Field>
        <Button isDanger size="small" onClick={handleClear}
          style={{ background: 'white', color: '#cc3340', borderColor: '#cc3340' }}>
          Clear Logs
        </Button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #d8dcde', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 120px 60px',
          padding: '8px 12px', background: '#f8f9f9',
          borderBottom: '1px solid #d8dcde', fontSize: '11px', fontWeight: 600, color: '#68737d',
        }}>
          <div>Time</div><div>Details</div><div>Phone</div><div>Status</div>
        </div>
        {logs.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#87929d' }}>No logs found</p>
        ) : (
          logs.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>

      {pagination.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          {pagination.page > 1 && (
            <Button size="small" onClick={() => fetchLogs(pagination.page - 1)}>Previous</Button>
          )}
          <span style={{ fontSize: '12px', color: '#68737d', alignSelf: 'center' }}>
            Page {pagination.page} of {pagination.total_pages}
          </span>
          {pagination.page < pagination.total_pages && (
            <Button size="small" onClick={() => fetchLogs(pagination.page + 1)}>Next</Button>
          )}
        </div>
      )}
    </div>
  );
}
