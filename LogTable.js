import { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

export default function LogTable({ initialLogs = [] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [filter, setFilter] = useState('');

  useEffect(() => setLogs(initialLogs), [initialLogs]);

  const exportCsv = async () => {
    const token = localStorage.getItem('uls_token');
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
    const res = await axios.get(`${base}/api/logs`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1000, export: 'csv' } });
    const csv = res.data;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'logs.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const applyFilter = () => {
    if (!filter) return setLogs(initialLogs);
    setLogs(initialLogs.filter(l => (l.message || '').toLowerCase().includes(filter.toLowerCase()) || (l.trace_id||'').includes(filter)));
  };

  return (
    <section className="card">
      <div className="toolbar">
        <input placeholder="Search message or trace_id" value={filter} onChange={e => setFilter(e.target.value)} />
        <button onClick={applyFilter}>Apply</button>
        <button onClick={() => { setFilter(''); setLogs(initialLogs); }}>Reset</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>
      <table className="log-table">
        <thead>
          <tr><th>Time</th><th>Service</th><th>Level</th><th>Server</th><th>Trace</th><th>Message</th></tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l._id || Math.random()} className={`level-${(l.log_level||'').toLowerCase()}`}>
              <td>{new Date(l.timestamp).toLocaleString()}</td>
              <td>{l.service_name}</td>
              <td>{l.log_level}</td>
              <td>{l.server_id}</td>
              <td>{l.trace_id}</td>
              <td className="mono">{l.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
