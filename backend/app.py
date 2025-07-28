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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TodoAPI")

app = FastAPI(title="Todo API", description="Docker Todo App with FastAPI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

system_logs = []

@app.middleware("http")
async def log_requests(request: Request, call_next):
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
    title: str
    due_date: Optional[str] = None

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    created_at: datetime
    due_date: Optional[datetime] = None

def get_db_connection():
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
    logger.info("💊 Health check requested")
    return {"status": "ok", "service": "backend", "timestamp": datetime.now().isoformat()}

@app.get("/api/logs")
def get_system_logs():
    logger.info("📋 System logs requested")
    return {"logs": system_logs[-50:], "total_requests": len(system_logs)}

@app.get("/api/database/structure")
def get_database_structure():
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
    import uvicorn
    init_db()
    
    port = int(os.environ.get('PORT', 5000))
    uvicorn.run(app, host='0.0.0.0', port=port)