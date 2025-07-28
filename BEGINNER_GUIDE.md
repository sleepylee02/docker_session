# 🎓 Beginner's Guide to Docker Todo App

**A complete walkthrough for new developers to understand modern web application architecture**

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Backend: FastAPI + Uvicorn](#-backend-fastapi--uvicorn)
3. [API Communication & Swagger](#-api-communication--swagger)
4. [Database Integration](#-database-integration)
5. [Docker Containerization](#-docker-containerization)
6. [How Everything Works Together](#-how-everything-works-together)

---

## 🌟 Project Overview

This Todo app demonstrates a **3-tier architecture**:

```
┌─────────────┐    HTTP API    ┌─────────────┐    SQL     ┌─────────────┐
│  Frontend   │ ──────────────→ │   Backend   │ ─────────→ │  Database   │
│   (Nginx)   │ ←────────────── │  (FastAPI)  │ ←───────── │(PostgreSQL) │
└─────────────┘    JSON        └─────────────┘  Records   └─────────────┘
```

**Each tier has a specific job:**
- **Frontend**: User interface (what users see and click)
- **Backend**: Business logic and API (processes requests)
- **Database**: Data storage (saves todos permanently)

---

## 🚀 Backend: FastAPI + Uvicorn

### What is FastAPI?

FastAPI is a Python framework for building APIs (Application Programming Interfaces). Think of it as a waiter in a restaurant:
- Takes orders (HTTP requests)
- Processes them (business logic)
- Delivers results (HTTP responses)

### What is Uvicorn?

Uvicorn is an ASGI server that runs your FastAPI application. It's like the restaurant kitchen that actually cooks the food the waiter ordered.

### How They Work Together

```python
# app.py - This is our main backend file
from fastapi import FastAPI

# Create the FastAPI "waiter"
app = FastAPI(title="Todo API")

# Define what the waiter can do (endpoints)
@app.get("/api/todos")
def get_todos():
    return {"message": "Here are your todos"}

# Start the "kitchen" (Uvicorn server)
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000)
```

### Key Backend Components

#### 1. **HTTP Middleware** (app.py:50-93)
```python
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # This runs BEFORE every request
    start_time = time.time()
    
    # Process the actual request
    response = await call_next(request)
    
    # This runs AFTER every request
    process_time = time.time() - start_time
    # Log the request for monitoring
```

**What it does**: Like a security guard who logs everyone entering and leaving a building.

#### 2. **Pydantic Models** (app.py:95-109)
```python
class TodoCreate(BaseModel):
    title: str
    due_date: Optional[str] = None
```

**What it does**: Defines the "shape" of data - like a form that ensures all todos have a title.

#### 3. **Database Connection** (app.py:120-140)
```python
def get_db_connection():
    conn = psycopg2.connect(
        host='db',  # Container name
        database='tododb',
        user='todouser',
        password='todopass'
    )
    return conn
```

**What it does**: Like getting a phone line to call the database.

---

## 📡 API Communication & Swagger

### What is an API?

An API (Application Programming Interface) is like a menu in a restaurant:
- Lists what you can order (endpoints)
- Tells you what ingredients you need (request format)  
- Shows you what you'll get (response format)

### Our API Endpoints

| Method | Endpoint | What it does | Like ordering... |
|--------|----------|--------------|------------------|
| `GET` | `/api/todos` | Get all todos | "Show me the menu" |
| `POST` | `/api/todos` | Create new todo | "I want to order pizza" |
| `PUT` | `/api/todos/1/toggle` | Mark todo complete | "Change my order" |
| `DELETE` | `/api/todos/1` | Delete todo | "Cancel my order" |

### Swagger Documentation

FastAPI automatically creates interactive documentation at `http://localhost:5000/docs`

**Why Swagger is Amazing:**
1. **Visual Interface**: See all your endpoints in a pretty web page
2. **Try It Out**: Test API calls directly in the browser
3. **Auto-Generated**: Updates automatically when you change code
4. **Documentation**: Shows request/response formats

### Frontend ↔ Backend Communication

#### Example: Adding a New Todo

**1. User types in frontend:**
```javascript
// frontend/app.js
const newTodo = {
    title: "Learn Docker",
    due_date: "2025-02-01"
};
```

**2. Frontend sends HTTP request:**
```javascript
fetch('http://localhost:5000/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTodo)
})
```

**3. Backend receives and processes:**
```python
# backend/app.py
@app.post("/api/todos")
def create_todo(todo: TodoCreate):
    # Validate data using Pydantic
    # Save to database
    # Return new todo with ID
    return new_todo
```

**4. Frontend receives response:**
```javascript
.then(response => response.json())
.then(newTodo => {
    console.log('Todo created:', newTodo);
    // Update the UI
});
```

---

## 💾 Database Integration

### What is PostgreSQL?

PostgreSQL is like a super-organized filing cabinet:
- **Tables**: Different drawers (todos, users, etc.)
- **Rows**: Individual files (each todo)
- **Columns**: Information categories (title, completed, date)

### Our Database Schema

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,          -- Auto-incrementing number
    title VARCHAR(255) NOT NULL,    -- Todo description
    completed BOOLEAN DEFAULT FALSE,-- Is it done?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE                   -- When is it due?
);
```

### How Backend Talks to Database

```python
# Example: Getting all todos
def get_todos():
    conn = get_db_connection()          # 1. Connect to database
    cur = conn.cursor()                 # 2. Get a "cursor" (like a pointer)
    
    cur.execute("SELECT * FROM todos")  # 3. Run SQL query
    todos = cur.fetchall()              # 4. Get results
    
    conn.close()                        # 5. Clean up connection
    return todos                        # 6. Return to API
```

### Database Operations (CRUD)

- **C**reate: `INSERT INTO todos (title) VALUES ('New todo')`
- **R**ead: `SELECT * FROM todos`
- **U**pdate: `UPDATE todos SET completed = true WHERE id = 1`
- **D**elete: `DELETE FROM todos WHERE id = 1`

---

## 🐳 Docker Containerization

### What is Docker?

Docker is like shipping containers for software:
- **Consistent**: Same environment everywhere
- **Isolated**: Each container is separate  
- **Portable**: Runs on any computer with Docker

### Our Container Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:    # Container 1: Web server
    build: ./frontend
    ports: ["8080:80"]
    
  backend:     # Container 2: API server  
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - TZ=Asia/Seoul
    
  db:          # Container 3: Database
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tododb
```

### Dockerfile Explained

#### Backend Dockerfile
```dockerfile
# Start with Python 3.11 base image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python packages
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Tell Docker which port to expose
EXPOSE 5000

# Command to run when container starts
CMD ["python", "app.py"]
```

#### Frontend Dockerfile
```dockerfile
# Start with Nginx web server
FROM nginx:alpine

# Copy HTML/CSS/JS files
COPY . /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Nginx runs on port 80 by default
EXPOSE 80
```

### Container Networking

```
┌─────────────┐    Port 8080    ┌──────────────┐
│   Your      │ ──────────────→ │   frontend   │
│  Browser    │                 │  container   │
└─────────────┘                 └──────────────┘
                                       │
                                       │ HTTP calls
                                       ▼
                                ┌──────────────┐    Port 5432
                                │   backend    │ ──────────────→ ┌──────────────┐
                                │  container   │                 │      db      │
                                └──────────────┘                 │  container   │
                                                                 └──────────────┘
```

### Docker Commands Explained

```bash
# Build and start all containers
docker-compose up --build

# What this does:
# 1. Reads docker-compose.yml
# 2. Builds images from Dockerfiles  
# 3. Creates containers
# 4. Sets up networking between them
# 5. Starts all services

# Stop all containers
docker-compose down

# Stop and remove data volumes
docker-compose down -v
```

---

## 🔄 How Everything Works Together

### Complete Request Flow

Let's trace what happens when you click "Add Todo":

#### 1. **Frontend (JavaScript)**
```javascript
// User clicks "Add" button
function addTodo() {
    const title = document.getElementById('todoInput').value;
    
    // Send HTTP POST request
    fetch('http://localhost:5000/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title })
    })
    .then(response => response.json())
    .then(newTodo => updateUI(newTodo));
}
```

#### 2. **Docker Network**
```
Browser → frontend:8080 → backend:5000 → db:5432
```

#### 3. **Backend Middleware**
```python
# Middleware logs the request
log_entry = {
    "timestamp": "2025-01-28T17:49:46",
    "method": "POST", 
    "url": "http://localhost:5000/api/todos"
}
```

#### 4. **FastAPI Route Handler**
```python
@app.post("/api/todos")
def create_todo(todo: TodoCreate):
    # Validate input with Pydantic
    if not todo.title.strip():
        raise HTTPException(400, "Title required")
    
    # Save to database
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO todos (title) VALUES (%s) RETURNING *",
        (todo.title,)
    )
    new_todo = cur.fetchone()
    conn.commit()
    
    return new_todo
```

#### 5. **Database Operation**
```sql
-- PostgreSQL executes:
INSERT INTO todos (title, completed, created_at) 
VALUES ('Learn Docker', false, CURRENT_TIMESTAMP) 
RETURNING *;

-- Returns: {id: 1, title: 'Learn Docker', completed: false, ...}
```

#### 6. **Response Journey**
```
Database → Backend → Docker Network → Frontend → Browser → User
```

### Real-Time Monitoring

The app includes a **two-column log viewer** that shows:

**GET Column (Reading data):**
- Loading todo list
- Checking health status
- Fetching logs

**Other Methods Column (Changing data):**
- POST: Creating todos (🟠 orange)
- PUT: Toggling completion (🔵 blue)  
- DELETE: Removing todos (🔴 red)

This helps you understand the difference between:
- **Read operations**: Getting existing data
- **Write operations**: Changing/creating data

### Development Workflow

```bash
# 1. Make code changes
vim backend/app.py

# 2. Rebuild containers
docker-compose down
docker-compose up --build

# 3. Test in browser
open http://localhost:8080

# 4. Check logs
docker-compose logs backend

# 5. Inspect database
docker-compose exec db psql -U todouser -d tododb
```

---

## 🎯 Key Learning Takeaways

### 1. **Separation of Concerns**
- Frontend: User Interface
- Backend: Business Logic  
- Database: Data Storage

### 2. **API-First Design**
- Frontend and backend communicate via HTTP
- APIs are contracts between services
- Swagger documentation makes APIs self-explaining

### 3. **Containerization Benefits**
- Consistent environments across machines
- Easy scaling and deployment
- Isolated dependencies

### 4. **Modern Development Patterns**
- RESTful API design
- Automatic documentation generation
- Real-time monitoring and logging
- Infrastructure as code (docker-compose.yml)

### 5. **Database Integration**
- SQL for data operations
- Connection pooling and management
- Schema design and migrations

---

## 🚀 What's Next?

To extend this project, you could add:

1. **Authentication**: User login/signup
2. **Real-time Updates**: WebSockets for live updates
3. **Caching**: Redis for better performance
4. **Testing**: Unit and integration tests
5. **CI/CD**: Automated deployment pipelines
6. **Monitoring**: Prometheus and Grafana
7. **Load Balancing**: Multiple backend instances

This foundation gives you the building blocks for complex, production-ready applications! 🌟

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/
- **REST API Design**: https://restfulapi.net/
- **HTTP Status Codes**: https://httpstatusdogs.com/

Happy coding! 🎉