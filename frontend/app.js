/**
 * Docker Todo App Frontend
 * 
 * A vanilla JavaScript application that provides a user interface for managing todo items.
 * Communicates with the FastAPI backend through REST API calls and includes comprehensive
 * logging and monitoring capabilities.
 * 
 */

// Backend API base URL - points to the FastAPI server
const API_URL = '/api';

/**
 * Centralized logging function for frontend operations.
 * 
 * Logs messages to both browser console and localStorage for persistence.
 * Supports different log levels and optional data objects.
 * 
 * @param {string} level - Log level: 'INFO', 'ERROR', or 'WARN'
 * @param {string} message - Main log message
 * @param {*} data - Optional additional data to log (will be stringified)
 */
function logToConsole(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `🌐 FRONTEND [${level}] ${timestamp}: ${message}`;
    
    switch(level) {
        case 'INFO':
            console.log(logMessage, data || '');
            break;
        case 'ERROR':
            console.error(logMessage, data || '');
            break;
        case 'WARN':
            console.warn(logMessage, data || '');
            break;
    }
    
    const logs = JSON.parse(localStorage.getItem('frontendLogs') || '[]');
    logs.push({
        timestamp,
        level,
        message,
        data: data ? JSON.stringify(data, null, 2) : null
    });
    
    if (logs.length > 50) logs.shift();
    localStorage.setItem('frontendLogs', JSON.stringify(logs));
}

/**
 * Load all todo items from the backend API.
 * 
 * Fetches todos from the /api/todos endpoint and displays them in the UI.
 * Includes performance timing and comprehensive error handling.
 * Automatically called on page load and after todo modifications.
 */
async function loadTodos() {
    try {
        logToConsole('INFO', '📝 Requesting todos from backend API');
        
        const startTime = performance.now();
        const response = await fetch(`${API_URL}/todos`);
        const endTime = performance.now();
        
        logToConsole('INFO', `📡 API Response received in ${Math.round(endTime - startTime)}ms`, {
            status: response.status,
            statusText: response.statusText
        });
        
        const todos = await response.json();
        
        logToConsole('INFO', `📊 Received ${todos.length} todos from backend`);
        displayTodos(todos);
    } catch (error) {
        logToConsole('ERROR', '❌ Failed to load todos', error.message);
        console.error('할 일 목록을 불러오는데 실패했습니다:', error);
    }
}

/**
 * Render todo items in the user interface.
 * 
 * Creates HTML elements for each todo with:
 * - Clickable title for toggling completion status
 * - Due date display with visual indicators (overdue, today)
 * - Delete button for removal
 * - Appropriate CSS classes for styling
 * 
 * @param {Array} todos - Array of todo objects from the API
 */
function displayTodos(todos) {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    logToConsole('INFO', `🎨 Rendering ${todos.length} todos in UI`);
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        // Format due date
        let dueDateHtml = '';
        if (todo.due_date) {
            const dueDate = new Date(todo.due_date);
            const today = new Date();
            const isToday = dueDate.toDateString() === today.toDateString();
            const isOverdue = dueDate < today && !isToday;
            
            let dateClass = '';
            if (isOverdue) dateClass = 'overdue';
            else if (isToday) dateClass = 'today';
            
            dueDateHtml = `<div class="todo-due-date ${dateClass}">
                📅 ${dueDate.toLocaleDateString('ko-KR')}
                ${isOverdue ? ' (지연)' : isToday ? ' (오늘)' : ''}
            </div>`;
        }
        
        li.innerHTML = `
            <div class="todo-content">
                <div class="todo-title" onclick="toggleTodo(${todo.id})">${todo.title}</div>
                ${dueDateHtml}
            </div>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">삭제</button>
        `;
        todoList.appendChild(li);
    });
}

/**
 * Create a new todo item from user input.
 * 
 * Validates form data and sends POST request to create a new todo.
 * Supports optional due date and handles various error scenarios.
 * Clears form inputs on successful creation.
 */
async function addTodo() {
    const input = document.getElementById('todoInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const title = input.value.trim();
    const dueDate = dueDateInput.value;
    
    if (!title) {
        logToConsole('WARN', '⚠️ Empty todo title - request cancelled');
        return;
    }
    
    try {
        const todoData = { title };
        if (dueDate) {
            todoData.due_date = dueDate;
            logToConsole('INFO', `➕ Creating new todo: "${title}" with due date: ${dueDate}`);
        } else {
            logToConsole('INFO', `➕ Creating new todo: "${title}" (no due date)`);
        }
        
        const startTime = performance.now();
        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todoData)
        });
        const endTime = performance.now();
        
        if (response.ok) {
            const newTodo = await response.json();
            logToConsole('INFO', `✅ Todo created successfully in ${Math.round(endTime - startTime)}ms`, {
                id: newTodo.id,
                title: newTodo.title,
                due_date: newTodo.due_date,
                database_operation: 'INSERT INTO todos (title, due_date) VALUES (...)'
            });
            
            input.value = '';
            dueDateInput.value = '';
            loadTodos();
        } else {
            const errorData = await response.json();
            logToConsole('ERROR', '❌ Failed to create todo - server error', {
                status: response.status,
                statusText: response.statusText,
                error_detail: errorData.detail
            });
        }
    } catch (error) {
        logToConsole('ERROR', '❌ Network error while creating todo', error.message);
        console.error('할 일 추가에 실패했습니다:', error);
    }
}

/**
 * Toggle the completion status of a todo item.
 * 
 * Sends PUT request to /api/todos/{id}/toggle endpoint to switch
 * between completed and pending states. Refreshes the todo list on success.
 * 
 * @param {number} id - Unique identifier of the todo to toggle
 */
async function toggleTodo(id) {
    try {
        logToConsole('INFO', `🔄 Toggling todo ID: ${id}`);
        
        const startTime = performance.now();
        const response = await fetch(`${API_URL}/todos/${id}/toggle`, { method: 'PUT' });
        const endTime = performance.now();
        
        if (response.ok) {
            const updatedTodo = await response.json();
            const status = updatedTodo.completed ? 'completed' : 'pending';
            logToConsole('INFO', `✅ Todo ${id} toggled to ${status} in ${Math.round(endTime - startTime)}ms`);
            loadTodos();
        } else {
            logToConsole('ERROR', `❌ Failed to toggle todo ${id}`, {
                status: response.status,
                statusText: response.statusText
            });
        }
    } catch (error) {
        logToConsole('ERROR', `❌ Network error while toggling todo ${id}`, error.message);
        console.error('상태 변경에 실패했습니다:', error);
    }
}

/**
 * Permanently delete a todo item.
 * 
 * Sends DELETE request to remove the todo from the database.
 * Refreshes the todo list on successful deletion.
 * 
 * @param {number} id - Unique identifier of the todo to delete
 */
async function deleteTodo(id) {
    try {
        logToConsole('INFO', `🗑️ Deleting todo ID: ${id}`);
        
        const startTime = performance.now();
        const response = await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
        const endTime = performance.now();
        
        if (response.ok) {
            logToConsole('INFO', `✅ Todo ${id} deleted successfully in ${Math.round(endTime - startTime)}ms`);
            loadTodos();
        } else {
            logToConsole('ERROR', `❌ Failed to delete todo ${id}`, {
                status: response.status,
                statusText: response.statusText
            });
        }
    } catch (error) {
        logToConsole('ERROR', `❌ Network error while deleting todo ${id}`, error.message);
        console.error('삭제에 실패했습니다:', error);
    }
}

// Global state variables for monitoring panels
let logsVisible = false;        // Whether the system logs panel is currently visible
let databaseVisible = false;    // Whether the database info panel is currently visible
let autoRefreshInterval;        // Interval ID for auto-refreshing monitoring data

/**
 * Toggle the visibility of the system logs monitoring panel.
 * 
 * Shows/hides the logs section and manages auto-refresh functionality.
 * When visible, automatically refreshes log data every 3 seconds.
 */
function toggleLogs() {
    const logSection = document.getElementById('logSection');
    logsVisible = !logsVisible;
    
    if (logsVisible) {
        logSection.style.display = 'block';
        loadSystemLogs();
        startAutoRefresh();
        logToConsole('INFO', '📊 Log viewer opened');
    } else {
        logSection.style.display = 'none';
        stopAutoRefresh();
        logToConsole('INFO', '📊 Log viewer closed');
    }
}

/**
 * Toggle the visibility of the database information monitoring panel.
 * 
 * Shows/hides the database section and manages auto-refresh functionality.
 * When visible, automatically refreshes database info every 3 seconds.
 */
function toggleDatabase() {
    const databaseSection = document.getElementById('databaseSection');
    databaseVisible = !databaseVisible;
    
    if (databaseVisible) {
        databaseSection.style.display = 'block';
        loadDatabaseInfo();
        startAutoRefresh();
        logToConsole('INFO', '🗄️ Database viewer opened');
    } else {
        databaseSection.style.display = 'none';
        stopAutoRefresh();
        logToConsole('INFO', '🗄️ Database viewer closed');
    }
}

/**
 * Load and display system request logs from the backend.
 * 
 * Fetches logs from /api/logs endpoint and renders them in a formatted table.
 * Shows recent HTTP requests with status codes, timing, and client information.
 */
async function loadSystemLogs() {
    try {
        const response = await fetch(`${API_URL}/logs`);
        const data = await response.json();
        
        const getLogContent = document.getElementById('getLogContent');
        const otherLogContent = document.getElementById('otherLogContent');
        const logStats = document.getElementById('logStats');
        
        if (!getLogContent || !otherLogContent) {
            console.error('Two-column elements not found!');
            return;
        }
        
        if (data.logs && data.logs.length > 0) {
            // Debug: Check timestamp format
            if (data.logs.length > 0) {
                console.log('Sample timestamp:', data.logs[0].timestamp);
            }
            
            // Separate logs by method
            const getLogs = [];
            const otherLogs = [];
            
            data.logs.forEach(log => {
                if (log.method === 'GET') {
                    getLogs.push(log);
                } else {
                    otherLogs.push(log);
                }
            });
            
            // Build GET column content
            let getHtml = '';
            if (getLogs.length > 0) {
                getHtml = getLogs.slice(-10).map(log => {
                    // Backend generates KST timestamps, extract clean HH:MM:SS format
                    const timeStr = log.timestamp.split('T')[1].split('.')[0];
                    const time = timeStr; // Use as-is since it's already in HH:MM:SS format
                    const statusClass = log.status_code >= 400 ? 'error' : 'success';
                    return `
                    <div class="log-entry ${statusClass}">
                        [${time}] 
                        <strong>GET</strong> ${log.url.split('localhost:5000')[1] || log.url} 
                        → ${log.status_code} (${log.process_time_ms}ms)
                        <br><small>Client: ${log.client_ip}</small>
                    </div>
                `;
                }).join('');
            } else {
                getHtml = '<div class="log-entry">GET 요청이 없습니다</div>';
            }
            
            // Build OTHER column content  
            let otherHtml = '';
            if (otherLogs.length > 0) {
                otherHtml = otherLogs.slice(-10).map(log => {
                    // Backend generates KST timestamps, extract clean HH:MM:SS format
                    const timeStr = log.timestamp.split('T')[1].split('.')[0];
                    const time = timeStr; // Use as-is since it's already in HH:MM:SS format
                    const statusClass = log.status_code >= 400 ? 'error' : 'success';
                    let methodColor = '#ff9800'; // orange for POST
                    if (log.method === 'PUT') methodColor = '#2196f3'; // blue for PUT
                    if (log.method === 'DELETE') methodColor = '#f44336'; // red for DELETE
                    
                    return `
                    <div class="log-entry ${statusClass}">
                        [${time}] 
                        <strong style="color: ${methodColor}">${log.method}</strong> ${log.url.split('localhost:5000')[1] || log.url} 
                        → ${log.status_code} (${log.process_time_ms}ms)
                        <br><small>Client: ${log.client_ip}</small>
                    </div>
                `;
                }).join('');
            } else {
                otherHtml = '<div class="log-entry">POST/PUT/DELETE 요청이 없습니다</div>';
            }
            
            // Update both columns
            getLogContent.innerHTML = getHtml;
            otherLogContent.innerHTML = otherHtml;
            
            // Update stats
            logStats.textContent = `총 ${data.total_requests}개 요청 | GET: ${getLogs.length}개 | 기타: ${otherLogs.length}개`;
            
        } else {
            getLogContent.innerHTML = '<div class="log-entry">로그가 없습니다</div>';
            otherLogContent.innerHTML = '<div class="log-entry">로그가 없습니다</div>';
            logStats.textContent = '로그 없음';
        }
        
    } catch (error) {
        const errorMsg = `<div class="log-entry error">로그 로딩 실패: ${error.message}</div>`;
        if (document.getElementById('getLogContent')) {
            document.getElementById('getLogContent').innerHTML = errorMsg;
        }
        if (document.getElementById('otherLogContent')) {
            document.getElementById('otherLogContent').innerHTML = errorMsg;
        }
        logToConsole('ERROR', '❌ Failed to load system logs', error.message);
    }
}

/**
 * Load and display database structure and sample data.
 * 
 * Fetches database schema information from /api/database/structure endpoint.
 * Shows table structure with column definitions and recent todo entries.
 * Useful for development and debugging database state.
 */
async function loadDatabaseInfo() {
    try {
        const response = await fetch(`${API_URL}/database/structure`);
        const data = await response.json();
        
        const databaseContent = document.getElementById('databaseContent');
        const dbStats = document.getElementById('dbStats');
        
        // Create table structure display
        let tableHTML = `
            <div style="margin-bottom: 15px;">
                <strong>📋 테이블 구조: ${data.table_name}</strong>
                <table class="db-table">
                    <thead>
                        <tr><th>컬럼</th><th>타입</th><th>Null 허용</th><th>기본값</th></tr>
                    </thead>
                    <tbody>
                        ${data.columns.map(col => `
                            <tr>
                                <td><strong>${col.column_name}</strong></td>
                                <td>${col.data_type}</td>
                                <td>${col.is_nullable === 'YES' ? '✅' : '❌'}</td>
                                <td>${col.column_default || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Add recent data
        if (data.sample_data && data.sample_data.length > 0) {
            const columns = Object.keys(data.sample_data[0]);
            tableHTML += `
                <div>
                    <strong>📊 최근 데이터 (최대 5개)</strong>
                    <table class="db-table">
                        <thead>
                            <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${data.sample_data.slice(0, 5).map(row => `
                                <tr>
                                    ${columns.map(col => {
                                        let value = row[col];
                                        if (col === 'created_at' && value) {
                                            value = new Date(value).toLocaleString('ko-KR');
                                        } else if (col === 'due_date' && value) {
                                            value = new Date(value).toLocaleDateString('ko-KR');
                                        } else if (col === 'completed') {
                                            value = value ? '✅ 완료' : '⏳ 진행중';
                                        }
                                        return `<td>${value || '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tableHTML += '<div class="log-entry">저장된 데이터가 없습니다.</div>';
        }
        
        databaseContent.innerHTML = tableHTML;
        dbStats.textContent = `${data.total_rows}개 레코드 | ${data.columns.length}개 컬럼 | 마지막 업데이트: ${new Date().toLocaleTimeString()}`;
        
    } catch (error) {
        document.getElementById('databaseContent').innerHTML = 
            `<div class="log-entry error">데이터베이스 정보 로딩 실패: ${error.message}</div>`;
        logToConsole('ERROR', '❌ Failed to load database info', error.message);
    }
}

/**
 * Start automatic refresh of monitoring panels.
 * 
 * Sets up a 3-second interval to refresh visible monitoring panels.
 * Only creates one interval even if multiple panels are open.
 */
function startAutoRefresh() {
    if (autoRefreshInterval) return;
    
    autoRefreshInterval = setInterval(() => {
        if (logsVisible) loadSystemLogs();
        if (databaseVisible) loadDatabaseInfo();
    }, 3000); // Refresh every 3 seconds
}

/**
 * Stop automatic refresh when no monitoring panels are visible.
 * 
 * Clears the refresh interval when both logs and database panels are closed.
 * Helps conserve resources and reduce unnecessary API calls.
 */
function stopAutoRefresh() {
    if (!logsVisible && !databaseVisible && autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

/**
 * Initialize the application when the DOM is fully loaded.
 * 
 * Sets up the initial state by loading existing todos from the backend.
 * This is the main entry point for the frontend application.
 */
document.addEventListener('DOMContentLoaded', () => {
    logToConsole('INFO', '🚀 Frontend application initialized');
    loadTodos();
});