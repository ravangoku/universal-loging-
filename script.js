(function () {
  const apiBase = '/api';
  const apiKey = 'uls_demo_key_12345'; // Integrated from user's backend config

  const qs = s => document.querySelector(s);

  const apiStatus = qs('#apiStatus');
  const serviceInput = qs('#serviceInput');
  const levelInput = qs('#levelInput');
  const serverIdInput = qs('#serverIdInput');
  const traceIdInput = qs('#traceIdInput');
  const messageInput = qs('#messageInput');
  const submitBtn = qs('#submitBtn');
  const refreshBtn = qs('#refreshBtn');
  const exportBtn = qs('#exportBtn');
  const searchInput = qs('#searchInput');
  const levelFilter = qs('#levelFilter');
  const serviceFilter = qs('#serviceFilter');
  const startDate = qs('#startDate');
  const endDate = qs('#endDate');
  const logsTableBody = qs('#logsTable tbody');

  function setStatus(msg, isError = false, isSuccess = false) {
    if (!apiStatus) return;
    apiStatus.textContent = msg || '';
    apiStatus.className = 'status show';
    if (isError) apiStatus.classList.add('error');
    else if (isSuccess) apiStatus.classList.add('success');
    else apiStatus.classList.add('info');
  }

  async function apiFetch(path, opts = {}) {
    opts.headers = opts.headers || {};
    // Inject API Key into every request
    opts.headers['X-API-KEY'] = apiKey;

    try {
      const res = await fetch(apiBase + path, opts);
      if (!res.ok) {
        let text = '';
        try {
          const json = await res.json();
          text = json.message || res.statusText;
        } catch (e) {
          text = await res.text();
        }
        throw new Error(res.status + ' ' + (text || res.statusText));
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json();
      }
      return await res.text();
    } catch (err) {
      throw err;
    }
  }

  function buildQuery() {
    const params = new URLSearchParams();
    if (searchInput && searchInput.value) {
      const q = searchInput.value.trim();
      if (q) params.set('q', q);
    }
    if (levelFilter && levelFilter.value) params.set('log_level', levelFilter.value);
    if (serviceFilter && serviceFilter.value) params.set('service_name', serviceFilter.value.trim());
    if (startDate && startDate.value) params.set('start', new Date(startDate.value).toISOString());
    if (endDate && endDate.value) {
      const d = new Date(endDate.value);
      d.setHours(23, 59, 59, 999);
      params.set('end', d.toISOString());
    }
    params.set('limit', '200');
    return params.toString() ? '?' + params.toString() : '';
  }

  function formatTimestamp(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch (e) {
      return ts;
    }
  }

  function levelClass(level) {
    return 'level-' + (level || 'INFO');
  }

  function renderLogs(arr) {
    if (!logsTableBody) return;
    logsTableBody.innerHTML = '';
    if (!arr || !arr.length) {
      logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No logs found</td></tr>';
      return;
    }

    arr.forEach(l => {
      const tr = document.createElement('tr');

      const ts = document.createElement('td');
      ts.textContent = formatTimestamp(l.timestamp);

      const svc = document.createElement('td');
      svc.textContent = l.service || l.service_name || 'unknown';

      const msg = document.createElement('td');
      msg.textContent = (l.message || '').substring(0, 100);
      msg.title = l.message || '';

      const lvl = document.createElement('td');
      lvl.textContent = l.level || l.log_level || 'INFO';
      lvl.className = levelClass(l.level || l.log_level);

      tr.appendChild(ts);
      tr.appendChild(svc);
      tr.appendChild(msg);
      tr.appendChild(lvl);
      logsTableBody.appendChild(tr);
    });
  }

  async function refreshLogs() {
    if (!logsTableBody) return;

    setStatus('Fetching logs...');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      const q = buildQuery();
      const data = await apiFetch('/logs' + q);
      if (!data) throw new Error('No data returned');
      const logs = (data && data.results) ? data.results : (Array.isArray(data) ? data : (data.logs || []));
      renderLogs(logs);
      const count = logs.length;
      setStatus(`Fetched ${count} log${count !== 1 ? 's' : ''}`, false, true);
    } catch (err) {
      setStatus('Fetch failed: ' + err.message, true);
      renderLogs([]);
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  async function submitLog() {
    if (!messageInput || !messageInput.value.trim()) {
      setStatus('Please enter a message', true);
      return;
    }

    const payload = {
      service: (serviceInput ? serviceInput.value.trim() : '') || 'unknown-service',
      level: (levelInput ? levelInput.value : '') || 'INFO',
      message: messageInput.value.trim() || '',
      server: (serverIdInput ? serverIdInput.value.trim() : '') || 'local',
      trace_id: (traceIdInput ? traceIdInput.value.trim() : '') || ''
    };

    setStatus('Submitting log...');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await apiFetch('/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res) throw new Error('No response from server');
      setStatus('Log submitted successfully', false, true);
      if (messageInput) messageInput.value = '';
      if (traceIdInput) traceIdInput.value = '';
      if (serviceInput) serviceInput.value = '';
      if (serverIdInput) serverIdInput.value = '';

      if (logsTableBody) {
        setTimeout(refreshLogs, 300);
      }
    } catch (err) {
      setStatus('Submit failed: ' + err.message, true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function exportCSV() {
    if (!exportBtn) return;
    setStatus('Preparing CSV export...');
    exportBtn.disabled = true;

    try {
      // Use the new /api/logs/export route
      const res = await fetch(apiBase + '/logs/export', {
        headers: { 'X-API-KEY': apiKey }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || res.statusText);
      }

      const blob = await res.blob();
      const link = document.createElement('a');
      const uurl = URL.createObjectURL(blob);
      link.setAttribute('href', uurl);
      link.setAttribute('download', 'logs-' + new Date().toISOString().split('T')[0] + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(uurl);
      setStatus('CSV downloaded successfully', false, true);
    } catch (err) {
      setStatus('Export failed: ' + err.message, true);
    } finally {
      exportBtn.disabled = false;
    }
  }

  function setupEventListeners() {
    if (submitBtn) submitBtn.addEventListener('click', submitLog);
    if (messageInput) {
      messageInput.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') submitLog();
      });
    }
    if (refreshBtn) refreshBtn.addEventListener('click', refreshLogs);
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    [searchInput, levelFilter, serviceFilter, startDate, endDate].forEach(el => {
      if (el) el.addEventListener('change', refreshLogs);
    });
  }

  function init() {
    setupEventListeners();
    if (logsTableBody) {
      refreshLogs();
    }
  }

  init();
})();
