/**
 * Universal Logging System v2.0 - Frontend Application
 * Handles authentication, API communication, and real-time features
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';
const WS_URL = 'ws://localhost:8000/ws/logs';

// Global State
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let ws = null;
let autoRefreshInterval = null;

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Universal Logging System v2.0 initialized');
    
    if (authToken) {
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Alert form
    document.getElementById('alertForm')?.addEventListener('submit', handleCreateAlert);
    
    // API Key form
    document.getElementById('apiKeyForm')?.addEventListener('submit', handleCreateApiKey);
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', debounce(() => {
        applyFilters();
    }, 500));
}

// ============================================================================
// Authentication
// ============================================================================

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        
        // Get user info
        await getCurrentUserInfo();
        
        showDashboard();
        loadDashboardData();
        showToast('Logged in successfully', 'success');
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = error.message;
        document.getElementById('loginError').classList.add('show');
    }
}

async function getCurrentUserInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            document.getElementById('userNameDisplay').textContent = currentUser.full_name || currentUser.username;
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    if (ws) ws.close();
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    showLogin();
    showToast('Logged out', 'success');
}

// ============================================================================
// UI Navigation
// ============================================================================

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'grid';
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab')?.classList.add('active');
    
    // Mark menu item as active
    event.target.closest('.menu-item')?.classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Real-time system overview' },
        'logs': { title: 'Logs', subtitle: 'View and search all logs' },
        'analytics': { title: 'Analytics', subtitle: 'System performance metrics' },
        'alerts': { title: 'Alerts', subtitle: 'Manage alert rules and notifications' },
        'apikeys': { title: 'API Keys', subtitle: 'Manage API keys for services' },
        'settings': { title: 'Settings', subtitle: 'User preferences and configuration' }
    };
    
    if (titles[tabName]) {
        document.getElementById('pageTitle').textContent = titles[tabName].title;
        document.getElementById('pageSubtitle').textContent = titles[tabName].subtitle;
    }
    
    // Load tab-specific data
    if (tabName === 'logs') loadLogsData();
    if (tabName === 'analytics') loadAnalyticsData();
    if (tabName === 'alerts') loadAlertsData();
    if (tabName === 'apikeys') loadApiKeysData();
}

// ============================================================================
// Dashboard Data
// ============================================================================

async function loadDashboardData() {
    try {
        await loadStatistics();
        await loadRecentLogs();
        loadApiKeysData();
        
        // Setup auto-refresh
        const refreshInterval = parseInt(
            document.getElementById('refreshInterval')?.value || 5
        ) * 1000;
        
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(() => {
            loadStatistics();
            loadRecentLogs();
        }, refreshInterval);
        
        // Connect WebSocket for real-time updates
        connectWebSocket();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/logs/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch statistics');
        
        const stats = await response.json();
        
        // Update stat cards
        document.getElementById('totalLogsCount').textContent = stats.total_logs;
        document.getElementById('errorCountDisplay').textContent = stats.error_count;
        document.getElementById('warningCountDisplay').textContent = stats.warning_count;
        document.getElementById('infoCountDisplay').textContent = stats.info_count;
        
        // Update health
        const errorRate = stats.error_rate || 0;
        const health = Math.max(0, 100 - errorRate);
        document.getElementById('healthFill').style.width = health + '%';
        document.getElementById('healthPercent').textContent = Math.round(health) + '%';
        document.getElementById('healthStatus').textContent = 
            health >= 90 ? 'Healthy' : health >= 70 ? 'Good' : health >= 50 ? 'Warning' : 'Critical';
        
        // Update performance metrics
        document.getElementById('errorRate').textContent = Math.round(errorRate) + '%';
        document.getElementById('avgResponseTime').textContent = 
            stats.avg_response_time_ms ? Math.round(stats.avg_response_time_ms) + 'ms' : '--';
        
        // Update services list
        updateServicesList(stats.services);
        
        // Get unique services for filters
        updateServiceFilters(stats.services);
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadRecentLogs() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/logs?limit=10&offset=0`,
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const logs = await response.json();
        renderRecentLogs(logs);
    } catch (error) {
        console.error('Error loading recent logs:', error);
    }
}

function renderRecentLogs(logs) {
    const container = document.getElementById('recentLogsList');
    
    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state">No logs yet</div>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="log-item ${log.log_level.toLowerCase()}">
            <div class="log-message">
                <div class="log-service">${escapeHtml(log.service_name)}</div>
                <div class="log-text">${escapeHtml(log.message.substring(0, 100))}</div>
                <div class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
            </div>
            <span class="level-badge level-${log.log_level.toLowerCase()}">
                ${log.log_level}
            </span>
        </div>
    `).join('');
}

// ============================================================================
// Logs Tab
// ============================================================================

async function loadLogsData() {
    try {
        await applyFilters();
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

async function applyFilters() {
    try {
        const serviceName = document.getElementById('filterService')?.value || '';
        const logLevel = document.getElementById('filterLevel')?.value || '';
        const search = document.getElementById('searchInput')?.value || '';
        
        let url = `${API_BASE_URL}/logs?limit=100&offset=0`;
        if (serviceName) url += `&service_name=${serviceName}`;
        if (logLevel) url += `&log_level=${logLevel}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const logs = await response.json();
        renderLogsTable(logs);
    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('Error loading logs', 'error');
    }
}

function renderLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6" class="text-center">No logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${escapeHtml(log.service_name)}</td>
            <td><span class="level-badge level-${log.log_level.toLowerCase()}">${log.log_level}</span></td>
            <td>${escapeHtml(log.message.substring(0, 50))}...</td>
            <td>${log.trace_id ? escapeHtml(log.trace_id.substring(0, 12)) + '...' : '--'}</td>
            <td><button class="btn-copy" onclick="viewLogDetail(${log.id})">View</button></td>
        </tr>
    `).join('');
}

async function viewLogDetail(logId) {
    try {
        const response = await fetch(`${API_BASE_URL}/logs/${logId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch log detail');
        
        const log = await response.json();
        alert(`Log ID: ${log.id}\nService: ${log.service_name}\nLevel: ${log.log_level}\nMessage: ${log.message}\nTrace ID: ${log.trace_id || 'N/A'}\nTimestamp: ${new Date(log.timestamp).toLocaleString()}`);
    } catch (error) {
        console.error('Error fetching log detail:', error);
        showToast('Error loading log detail', 'error');
    }
}

async function exportLogs(format) {
    try {
        const endpoint = format === 'csv' ? '/logs/export/csv' : '/logs/export/json';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to export logs');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast(`Logs exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
        console.error('Error exporting logs:', error);
        showToast('Error exporting logs', 'error');
    }
}

// ============================================================================
// Analytics Tab
// ============================================================================

async function loadAnalyticsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/logs/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch analytics');
        
        const stats = await response.json();
        
        // Create log level distribution chart
        createLogLevelChart(stats);
        
        // Update services list
        updateServicesList(stats.services);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function createLogLevelChart(stats) {
    const canvas = document.getElementById('logLevelChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const data = [
        stats.debug_count || 0,
        stats.info_count || 0,
        stats.warning_count || 0,
        stats.error_count || 0,
        stats.critical_count || 0
    ];
    const labels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const colors = ['#0066cc', '#28a745', '#ffc107', '#dc3545', '#721c24'];
    
    // Simple bar chart implementation
    canvas.height = 300;
    const width = canvas.width / labels.length;
    const maxData = Math.max(...data, 1);
    const height = canvas.height;
    
    data.forEach((value, i) => {
        const barHeight = (value / maxData) * (height - 40);
        const x = i * width + 10;
        const y = height - barHeight - 20;
        
        // Draw bar
        ctx.fillStyle = colors[i];
        ctx.fillRect(x, y, width - 20, barHeight);
        
        // Draw label
        ctx.fillStyle = '#212529';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + (width - 20) / 2, height - 5);
        
        // Draw value
        ctx.fillText(value, x + (width - 20) / 2, y - 5);
    });
}

function updateServicesList(services) {
    const container = document.getElementById('servicesListContainer');
    if (!container) return;
    
    if (services.length === 0) {
        container.innerHTML = '<div class="empty-state">No services</div>';
        return;
    }
    
    container.innerHTML = services.map(service => `
        <div class="service-item">
            <span class="service-name">${escapeHtml(service)}</span>
            <span class="service-count">Active</span>
        </div>
    `).join('');
}

function updateServiceFilters(services) {
    const select = document.getElementById('filterService');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Services</option>' +
        services.map(s => `<option value="${s}">${escapeHtml(s)}</option>`).join('');
    select.value = currentValue;
}

// ============================================================================
// Alerts Tab
// ============================================================================

async function loadAlertsData() {
    try {
        await loadAlertRules();
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

async function loadAlertRules() {
    try {
        const response = await fetch(`${API_BASE_URL}/alerts/rules`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch alert rules');
        
        const rules = await response.json();
        renderAlertRules(rules);
    } catch (error) {
        console.error('Error loading alert rules:', error);
    }
}

function renderAlertRules(rules) {
    const container = document.getElementById('alertRulesList');
    
    if (rules.length === 0) {
        container.innerHTML = '<div class="empty-state">No alert rules created</div>';
        return;
    }
    
    container.innerHTML = rules.map(rule => `
        <div class="rule-item">
            <div class="rule-header">
                <div class="rule-name">${escapeHtml(rule.name)}</div>
                <span class="rule-badge">${rule.log_level}</span>
            </div>
            <div class="rule-details">
                <div><strong>Service:</strong> ${rule.service_name || 'All'}</div>
                <div><strong>Alert To:</strong> ${rule.alert_type}</div>
                <div><strong>Threshold:</strong> ${rule.threshold}</div>
                <div><strong>Created:</strong> ${new Date(rule.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

async function handleCreateAlert(e) {
    e.preventDefault();
    
    const alertData = {
        name: document.getElementById('alertName').value,
        service_name: document.getElementById('alertService').value || null,
        log_level: document.getElementById('alertLevel').value,
        alert_type: document.getElementById('alertType').value,
        alert_target: document.getElementById('alertTarget').value,
        threshold: parseInt(document.getElementById('alertThreshold').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/alerts/rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(alertData)
        });
        
        if (!response.ok) throw new Error('Failed to create alert rule');
        
        showToast('Alert rule created successfully', 'success');
        document.getElementById('alertForm').reset();
        await loadAlertRules();
    } catch (error) {
        console.error('Error creating alert:', error);
        showToast('Error creating alert rule', 'error');
    }
}

// ============================================================================
// API Keys Tab
// ============================================================================

async function loadApiKeysData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api-keys`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch API keys');
        
        const keys = await response.json();
        renderApiKeys(keys);
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

function renderApiKeys(keys) {
    const container = document.getElementById('apiKeysList');
    
    if (keys.length === 0) {
        container.innerHTML = '<div class="empty-state">No API keys generated</div>';
        return;
    }
    
    container.innerHTML = keys.map(key => `
        <div class="api-key-item">
            <div class="api-key-info">
                <h4>${escapeHtml(key.name)}</h4>
                <div class="api-key-preview">${escapeHtml(key.key_preview)}</div>
                <small>Service: ${escapeHtml(key.service_name)} | Created: ${new Date(key.created_at).toLocaleDateString()}</small>
            </div>
            <button class="btn-copy" onclick="copyToClipboard('${key.key}')">Copy</button>
        </div>
    `).join('');
}

async function handleCreateApiKey(e) {
    e.preventDefault();
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api-keys?name=${encodeURIComponent(document.getElementById('keyName').value)}&service_name=${encodeURIComponent(document.getElementById('serviceName').value)}`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );
        
        if (!response.ok) throw new Error('Failed to create API key');
        
        const newKey = await response.json();
        showToast('API Key created: ' + newKey.key, 'success');
        document.getElementById('apiKeyForm').reset();
        await loadApiKeysData();
    } catch (error) {
        console.error('Error creating API key:', error);
        showToast('Error creating API key', 'error');
    }
}

// ============================================================================
// WebSocket Connection
// ============================================================================

function connectWebSocket() {
    if (ws) ws.close();
    
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'log_ingested') {
            showToast(`${data.count} new logs from ${data.service}`, 'info');
            loadDashboardData();
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (authToken) {
            setTimeout(connectWebSocket, 5000);
        }
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard', 'success');
    });
}

async function clearOldLogs() {
    if (!confirm('Are you sure? This will delete logs older than 30 days.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/logs/old?days=30`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to clear logs');
        
        const result = await response.json();
        showToast(`Deleted ${result.deleted_count} logs`, 'success');
    } catch (error) {
        console.error('Error clearing logs:', error);
        showToast('Error clearing logs', 'error');
    }
}

console.log('Application loaded successfully');
