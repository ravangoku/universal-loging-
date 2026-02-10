const axios = require('axios');
const config = require('../src/config');

async function send() {
  const base = process.env.API_BASE || 'http://localhost:4000';
  const payload = {
    timestamp: new Date().toISOString(),
    service_name: 'demo-service',
    log_level: 'ERROR',
    message: 'Sample error from script',
    server_id: 'local-1',
    trace_id: 'trace-' + Math.random().toString(36).slice(2,8)
  };
  try {
    const res = await axios.post(`${base}/api/logs`, payload, { headers: { 'x-api-key': process.env.API_KEY || config.apiKey || 'replace-with-secure-key' } });
    console.log('sent', res.data);
  } catch (err) {
    console.error('send error', err?.response?.data || err.message);
  }
}

send();
