const API_URL = 'http://localhost:5000/api';

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

let logsVisible = false;
let databaseVisible = false;
let autoRefreshInterval;

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

async function loadSystemLogs() {
    try {
        const response = await fetch(`${API_URL}/logs`);
        const data = await response.json();
        
        const logContent = document.getElementById('logContent');
        const logStats = document.getElementById('logStats');
        
        if (data.logs && data.logs.length > 0) {
            logContent.innerHTML = data.logs
                .slice(-20)
                .map(log => {
                    const statusClass = log.status_code >= 400 ? 'error' : 'success';
                    return `<div class="log-entry ${statusClass}">
                        [${log.timestamp.split('T')[1].split('.')[0]}] 
                        ${log.method} ${log.url.split('localhost:5000')[1] || log.url} 
                        → ${log.status_code} (${log.process_time_ms}ms)
                        <br><small>Client: ${log.client_ip}</small>
                    </div>`;
                })
                .join('');
        } else {
            logContent.innerHTML = '<div class="log-entry">아직 로그가 없습니다.</div>';
        }
        
        logStats.textContent = `총 ${data.total_requests}개 요청 | 최근 ${data.logs.length}개 표시`;
        
    } catch (error) {
        document.getElementById('logContent').innerHTML = 
            `<div class="log-entry error">로그 로딩 실패: ${error.message}</div>`;
        logToConsole('ERROR', '❌ Failed to load system logs', error.message);
    }
}

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

function startAutoRefresh() {
    if (autoRefreshInterval) return;
    
    autoRefreshInterval = setInterval(() => {
        if (logsVisible) loadSystemLogs();
        if (databaseVisible) loadDatabaseInfo();
    }, 3000); // Refresh every 3 seconds
}

function stopAutoRefresh() {
    if (!logsVisible && !databaseVisible && autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    logToConsole('INFO', '🚀 Frontend application initialized');
    loadTodos();
});