/**
 * Universal Logging System - Frontend JavaScript
 * Handles API communication and dynamic UI updates
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const LOGS_POLLING_INTERVAL = 2000; // 2 seconds

// Track log entries to avoid duplicates
let logEntrySet = new Set();
let logCount = 0;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Universal Logging System - Dashboard Loaded');
    
    // Fetch and display initiatives
    loadInitiatives();
    
    // Setup form submission
    document.getElementById('initiativeForm').addEventListener('submit', addInitiative);
    
    // Polling for logs
    startLogPolling();
    
    // Initial fetch for logs
    fetchLogs();
});

/**
 * Fetch all initiatives from API
 */
async function loadInitiatives() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/initiatives`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const initiatives = data.initiatives || [];
        
        // Update stats
        document.getElementById('totalCount').textContent = initiatives.length;
        
        // Render initiatives in table
        renderInitiatives(initiatives);
    } catch (error) {
        console.error('Error loading initiatives:', error);
        showEmptyState('Failed to load initiatives. Make sure the backend API is running on port 5000.');
    }
}

/**
 * Render initiatives in the table
 */
function renderInitiatives(initiatives) {
    const tableBody = document.getElementById('initiativeTableBody');
    
    if (initiatives.length === 0) {
        tableBody.innerHTML = '<tr class="empty-state"><td colspan="4">No initiatives yet. Add one using the form above!</td></tr>';
        return;
    }
    
    tableBody.innerHTML = initiatives.map((initiative, index) => `
        <tr>
            <td><strong style="color: var(--accent-light)">${escapeHtml(initiative.category)}</strong></td>
            <td>${escapeHtml(initiative.name)}</td>
            <td>${escapeHtml(initiative.problem)}</td>
            <td>
                <button class="action-btn" onclick="deleteInitiative(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Add new initiative via API
 */
async function addInitiative(e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value;
    const name = document.getElementById('name').value;
    const problem = document.getElementById('problem').value;
    
    if (!category || !name || !problem) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/initiatives`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: category,
                name: name,
                problem: problem
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Clear form and reload
        document.getElementById('initiativeForm').reset();
        
        // Reload initiatives
        loadInitiatives();
        
        // Scroll to table
        document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error adding initiative:', error);
        alert('Failed to add initiative. Make sure the backend API is running.');
    }
}

/**
 * Delete an initiative
 */
async function deleteInitiative(index) {
    if (!confirm('Are you sure you want to delete this initiative?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/initiatives/${index}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Reload initiatives
        loadInitiatives();
    } catch (error) {
        console.error('Error deleting initiative:', error);
        alert('Failed to delete initiative.');
    }
}

/**
 * Fetch logs from API
 */
async function fetchLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/logs`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const logs = data.logs || [];
        
        // Add new logs to display
        logs.forEach(log => {
            const logKey = `${log.timestamp}-${log.message}-${log.level}`;
            if (!logEntrySet.has(logKey)) {
                logEntrySet.add(logKey);
                addLogToDisplay(log);
                logCount++;
            }
        });
        
        // Update log count
        document.getElementById('logsCount').textContent = logCount;
    } catch (error) {
        console.error('Error fetching logs:', error);
        // Not critical - logs are optional
    }
}

/**
 * Add log entry to display
 */
function addLogToDisplay(log) {
    const logsContainer = document.getElementById('logsContainer');
    
    // Clear the initial message if present
    const initialMsg = logsContainer.querySelector('.log-entry');
    if (initialMsg && initialMsg.textContent === 'Connecting to logging service...') {
        logsContainer.innerHTML = '';
    }
    
    const logTime = new Date(log.timestamp).toLocaleTimeString();
    const logElement = document.createElement('div');
    logElement.className = `log-entry ${log.level.toLowerCase()}`;
    logElement.textContent = `[${logTime}] [${log.level}] ${log.source}: ${log.message}`;
    
    // Add to top of logs
    logsContainer.insertBefore(logElement, logsContainer.firstChild);
    
    // Keep only last 50 entries
    while (logsContainer.children.length > 50) {
        logsContainer.removeChild(logsContainer.lastChild);
    }
}

/**
 * Start polling for logs
 */
function startLogPolling() {
    setInterval(fetchLogs, LOGS_POLLING_INTERVAL);
}

/**
 * Show empty state message
 */
function showEmptyState(message) {
    const tableBody = document.getElementById('initiativeTableBody');
    tableBody.innerHTML = `<tr class="empty-state"><td colspan="4">${escapeHtml(message)}</td></tr>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
