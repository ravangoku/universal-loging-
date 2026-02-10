import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import LogTable from '../components/LogTable';
import Charts from '../components/Charts';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('uls_token');
    if (!token) return (window.location.href = '/');
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

    axios.get(`${base}/api/logs`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 100 } })
      .then(r => setLogs(r.data.results || []))
      .catch(() => {});

    socketRef.current = io(base, { transports: ['websocket'] });
    socketRef.current.on('connect', () => console.log('socket connected'));
    socketRef.current.on('log', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 1000));
    });

    return () => socketRef.current?.disconnect();
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>Universal Logging System</h1>
      </header>
      <main>
        <Charts logs={logs} />
        <LogTable initialLogs={logs} />
      </main>
    </div>
  );
}
