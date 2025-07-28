"""Docker Todo App Backend

A FastAPI-based REST API for managing todo items with PostgreSQL database.
This application provides CRUD operations for todos, system logging, and database inspection capabilities.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging
import time
from datetime import datetime
from typing import List, Optional
import json

# Configure logging for the application
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TodoAPI")

# Initialize FastAPI application
app = FastAPI(
    title="Todo API", 
    description="Docker Todo App with FastAPI - A comprehensive todo management system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global list to store system request logs (in-memory storage)
system_logs = []

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """HTTP middleware to log all incoming requests and responses.
    
    This middleware captures:
    - Request method, URL, client IP, and user agent
    - Response status code, processing time, and content length
    - Stores logs in memory for monitoring purposes
    
    Args:
        request (Request): Incoming HTTP request
        call_next: Next middleware/route handler
        
    Returns:
        Response: HTTP response with added logging
    """
    start_time = time.time()
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    
    logger.info(f"🌐 REQUEST: {request.method} {request.url.path} from {log_entry['client_ip']}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    log_entry.update({
        "status_code": response.status_code,
        "process_time_ms": round(process_time * 1000, 2),
        "response_size": response.headers.get("content-length", "unknown")
    })
    
    logger.info(f"📤 RESPONSE: {response.status_code} in {log_entry['process_time_ms']}ms")
    
    system_logs.append(log_entry)
    if len(system_logs) > 100:
        system_logs.pop(0)
    
    return response

class TodoCreate(BaseModel):
    """Pydantic model for creating new todo items.
    
    Attributes:
        title (str): The todo item title/description
        due_date (Optional[str]): Due date in YYYY-MM-DD format, defaults to None
    """
    title: str
    due_date: Optional[str] = None

class TodoResponse(BaseModel):
    """Pydantic model for todo item responses.
    
    Attributes:
        id (int): Unique identifier for the todo item
        title (str): The todo item title/description
        completed (bool): Whether the todo is completed
        created_at (datetime): When the todo was created
        due_date (Optional[datetime]): Due date for the todo, defaults to None
    """
    id: int
    title: str
    completed: bool
    created_at: datetime
    due_date: Optional[datetime] = None

def get_db_connection():
    """Establish connection to PostgreSQL database.
    
    Uses environment variables for database configuration:
    - DB_HOST: Database host (default: 'db')
    - DB_PORT: Database port (default: 5432)
    - DB_NAME: Database name (default: 'tododb')
    - DB_USER: Database user (default: 'todouser')
    - DB_PASSWORD: Database password (default: 'todopass')
    
    Returns:
        psycopg2.connection: Active database connection
        
    Raises:
        Exception: If database connection fails
    """
    try:
        db_host = os.environ.get('DB_HOST', 'db')
        logger.info(f"🔌 Connecting to database at {db_host}:5432")
        
        conn = psycopg2.connect(
            host=db_host,
            port=os.environ.get('DB_PORT', 5432),
            database=os.environ.get('DB_NAME', 'tododb'),
            user=os.environ.get('DB_USER', 'todouser'),
            password=os.environ.get('DB_PASSWORD', 'todopass')
        )
        
        logger.info("✅ Database connection successful")
        return conn
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        raise

def init_db():
    """Initialize database schema and tables.
    
    Creates the 'todos' table if it doesn't exist and adds the 'due_date' column
    if it's missing from existing installations.
    
    Database Schema:
        - id: SERIAL PRIMARY KEY
        - title: VARCHAR(255) NOT NULL
        - completed: BOOLEAN DEFAULT FALSE
        - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        - due_date: DATE (added later for backward compatibility)
        
    Raises:
        Exception: If database initialization fails
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Create table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add due_date column if it doesn't exist
        cur.execute("""
            ALTER TABLE todos 
            ADD COLUMN IF NOT EXISTS due_date DATE
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        logger.info("✅ Database schema updated with due_date column")
        print("데이터베이스 테이블이 준비되었습니다.")
    except Exception as e:
        logger.error(f"❌ Database initialization error: {str(e)}")
        print(f"데이터베이스 초기화 오류: {e}")

@app.get("/health")
def health_check():
    """Health check endpoint for container orchestration.
    
    Returns basic service status and timestamp for monitoring purposes.
    Used by Docker Compose and Kubernetes for health checks.
    
    Returns:
        dict: Service status information
            - status: Always "ok" if service is running
            - service: Service identifier ("backend")
            - timestamp: Current ISO timestamp
    """
    logger.info("💊 Health check requested")
    return {"status": "ok", "service": "backend", "timestamp": datetime.now().isoformat()}

@app.get("/api/logs")
def get_system_logs():
    """Retrieve system request logs for monitoring.
    
    Returns the last 50 HTTP request logs captured by the middleware.
    Useful for debugging and monitoring application usage.
    
    Returns:
        dict: Log information
            - logs: List of recent log entries (max 50)
            - total_requests: Total number of requests processed
    """
    logger.info("📋 System logs requested")
    return {"logs": system_logs[-50:], "total_requests": len(system_logs)}

@app.get("/api/database/structure")
def get_database_structure():
    """Inspect database schema and sample data.
    
    Provides detailed information about the todos table structure,
    including column definitions, data types, and recent sample data.
    Useful for development and debugging purposes.
    
    Returns:
        dict: Database structure information
            - table_name: Name of the main table ("todos")
            - columns: List of column definitions with types and constraints
            - total_rows: Total number of records in the table
            - sample_data: Up to 10 most recent todo items
            
    Raises:
        HTTPException: 500 if database query fails
    """
    logger.info("🗄️ Database structure requested")
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get table structure
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'todos'
            ORDER BY ordinal_position
        """)
        columns = cur.fetchall()
        
        # Get sample data with row count
        cur.execute("SELECT COUNT(*) as total_rows FROM todos")
        row_count = cur.fetchone()['total_rows']
        
        cur.execute("SELECT * FROM todos ORDER BY created_at DESC LIMIT 10")
        sample_data = cur.fetchall()
        
        cur.close()
        conn.close()
        
        result = {
            "table_name": "todos",
            "columns": columns,
            "total_rows": row_count,
            "sample_data": sample_data
        }
        
        logger.info(f"✅ Database structure retrieved: {len(columns)} columns, {row_count} rows")
        return result
    except Exception as e:
        logger.error(f"❌ Failed to get database structure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터베이스 구조 조회 실패: {str(e)}")

@app.get("/api/todos", response_model=List[TodoResponse])
def get_todos():
    """Retrieve all todo items from the database.
    
    Fetches all todos ordered by creation date (newest first).
    This endpoint supports the main todo list display functionality.
    
    Returns:
        List[TodoResponse]: List of all todo items with full details
        
    Raises:
        HTTPException: 500 if database query fails
    """
    try:
        logger.info("📝 Fetching all todos from database")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT * FROM todos ORDER BY created_at DESC")
        todos = cur.fetchall()
        
        logger.info(f"📝 Retrieved {len(todos)} todos from database")
        
        cur.close()
        conn.close()
        
        return todos
    except Exception as e:
        logger.error(f"❌ Failed to fetch todos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"할 일 목록 조회 실패: {str(e)}")

@app.post("/api/todos", response_model=TodoResponse, status_code=201)
def create_todo(todo: TodoCreate):
    """Create a new todo item.
    
    Validates input data and creates a new todo in the database.
    Supports optional due date in YYYY-MM-DD format.
    
    Args:
        todo (TodoCreate): Todo creation data
            - title: Required todo title (non-empty string)
            - due_date: Optional due date in YYYY-MM-DD format
    
    Returns:
        TodoResponse: The created todo item with generated ID and timestamp
        
    Raises:
        HTTPException: 
            - 400 if title is empty or due_date format is invalid
            - 500 if database operation fails
    """
    try:
        logger.info(f"➕ Creating new todo: '{todo.title}' with due_date: {todo.due_date}")
        
        if not todo.title.strip():
            logger.warning("⚠️ Empty todo title rejected")
            raise HTTPException(status_code=400, detail="제목이 필요합니다")
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Parse due_date if provided
        due_date = None
        if todo.due_date:
            try:
                due_date = datetime.strptime(todo.due_date, '%Y-%m-%d').date()
                logger.info(f"📅 Parsed due_date: {due_date}")
            except ValueError:
                logger.warning(f"⚠️ Invalid date format: {todo.due_date}")
                raise HTTPException(status_code=400, detail="날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)")
        
        cur.execute(
            "INSERT INTO todos (title, due_date) VALUES (%s, %s) RETURNING *",
            (todo.title, due_date)
        )
        new_todo = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"✅ Todo created successfully with ID: {new_todo['id']}, due_date: {new_todo.get('due_date')}")
        return new_todo
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create todo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"할 일 추가 실패: {str(e)}")

@app.put("/api/todos/{todo_id}/toggle", response_model=TodoResponse)
def toggle_todo(todo_id: int):
    """Toggle the completion status of a todo item.
    
    Switches a todo between completed and pending states.
    This is the primary way users mark todos as done or undone.
    
    Args:
        todo_id (int): Unique identifier of the todo to toggle
    
    Returns:
        TodoResponse: The updated todo item with new completion status
        
    Raises:
        HTTPException:
            - 404 if todo with given ID doesn't exist
            - 500 if database operation fails
    """
    try:
        logger.info(f"🔄 Toggling todo ID: {todo_id}")
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "UPDATE todos SET completed = NOT completed WHERE id = %s RETURNING *",
            (todo_id,)
        )
        updated_todo = cur.fetchone()
        
        if not updated_todo:
            logger.warning(f"⚠️ Todo ID {todo_id} not found for toggle")
            raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다")
        
        conn.commit()
        cur.close()
        conn.close()
        
        status = "completed" if updated_todo['completed'] else "pending"
        logger.info(f"✅ Todo ID {todo_id} toggled to {status}")
        
        return updated_todo
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to toggle todo {todo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"상태 변경 실패: {str(e)}")

@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int):
    """Delete a todo item permanently.
    
    Removes a todo from the database completely. This action cannot be undone.
    
    Args:
        todo_id (int): Unique identifier of the todo to delete
    
    Returns:
        None: 204 No Content status on successful deletion
        
    Raises:
        HTTPException:
            - 404 if todo with given ID doesn't exist
            - 500 if database operation fails
    """
    try:
        logger.info(f"🗑️ Deleting todo ID: {todo_id}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM todos WHERE id = %s", (todo_id,))
        deleted_count = cur.rowcount
        
        if deleted_count == 0:
            logger.warning(f"⚠️ Todo ID {todo_id} not found for deletion")
            raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다")
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"✅ Todo ID {todo_id} deleted successfully")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete todo {todo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"삭제 실패: {str(e)}")

if __name__ == '__main__':
    """Application entry point when run directly.
    
    Initializes the database schema and starts the Uvicorn ASGI server.
    Reads port from PORT environment variable (defaults to 5000).
    """
    import uvicorn
    init_db()
    
    port = int(os.environ.get('PORT', 5000))
    uvicorn.run(app, host='0.0.0.0', port=port)