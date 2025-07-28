# Docker Todo App

A 3-tier web application demonstrating Docker containerization with FastAPI backend, vanilla JS frontend, and PostgreSQL database.

## Quick Start

```bash
docker-compose up --build
```

**Access:** http://localhost:8080

## Project Structure

```
docker-todo-app/
├── frontend/          # Nginx + HTML/CSS/JS
├── backend/           # FastAPI + Python
├── docker-compose.yml # Service orchestration
└── README.md
```

## Tech Stack

- **Frontend:** HTML/CSS/JavaScript + Nginx
- **Backend:** Python 3.11 + FastAPI
- **Database:** PostgreSQL 15
- **Container:** Docker + Docker Compose

## API Documentation

**Base URL:** `http://localhost:5000/api`
**Interactive Docs:** http://localhost:5000/docs

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/todos` | Get all todos |
| POST | `/api/todos` | Create todo |
| PUT | `/api/todos/{id}/toggle` | Toggle completion |
| DELETE | `/api/todos/{id}` | Delete todo |
| GET | `/api/logs` | System logs |

### Request/Response Examples

**Create Todo:**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Docker", "due_date": "2025-02-01"}'
```

**Response:**
```json
{
  "id": 1,
  "title": "Learn Docker",
  "completed": false,
  "created_at": "2025-01-15T10:30:00.123456",
  "due_date": "2025-02-01T00:00:00"
}
```

**Toggle Todo:**
```bash
curl -X PUT http://localhost:5000/api/todos/1/toggle
```

**Get All Todos:**
```bash
curl http://localhost:5000/api/todos
```

## Database Schema

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE
);
```

## Development

### View Logs
```bash
docker-compose logs -f backend
```

### Database Access
```bash
docker-compose exec db psql -U todouser -d tododb
```

### Debugging
- Backend logs: Check Docker logs or `/api/logs` endpoint
- Database: Use built-in database viewer in frontend
- Network issues: Verify container communication

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | db | Database host |
| DB_USER | todouser | Database user |
| DB_PASSWORD | todopass | Database password |
| DB_NAME | tododb | Database name |

## Docker Commands

```bash
# Start services
docker-compose up --build

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# View service status
docker-compose ps
```

## Features

- ✅ CRUD operations for todos
- ✅ Due date support
- ✅ Real-time logging
- ✅ Database monitoring
- ✅ Health checks
- ✅ CORS enabled
- ✅ Auto-generated API docs