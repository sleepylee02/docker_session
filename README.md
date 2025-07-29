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

## Features
  
- ✅ CRUD operations for todos
- ✅ Due date support with visual indicators
- ✅ Real-time two-column log monitoring
- ✅ Database structure inspection
- ✅ Health checks and system monitoring
- ✅ CORS enabled for development

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
| GET | `/api/logs` | System request logs |
| GET | `/api/database/structure` | Database info |

### API Examples

**Create Todo:**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Docker", "due_date": "2025-02-01"}'
```

**Get All Todos:**
```bash
curl http://localhost:5000/api/todos
```

**Toggle Todo Status:**
```bash
curl -X PUT http://localhost:5000/api/todos/1/toggle
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

## Monitoring Features

### Real-time Log Viewer
- **Two-column display:** GET requests vs Other methods (POST/PUT/DELETE)
- **Performance metrics:** Response times and status codes
- **Client tracking:** IP addresses and request patterns
- **Auto-refresh:** Updates every 3 seconds when active

### Database Inspector
- **Live schema view:** Table structure and column definitions
- **Sample data:** Recent todo entries with formatting
- **Statistics:** Row counts and real-time updates

## Development Commands

```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop services
docker-compose down

# Clean restart (removes volumes)
docker-compose down -v && docker-compose up --build

# Database access
docker-compose exec db psql -U todouser -d tododb
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | db | Database host |
| DB_USER | todouser | Database user |
| DB_PASSWORD | todopass | Database password |
| DB_NAME | tododb | Database name |

## Troubleshooting

### Container Issues
- **Port conflicts:** Change ports in `docker-compose.yml`
- **Build failures:** Run `docker-compose down -v` then rebuild
- **Network issues:** Check `docker network ls`

### Application Issues
- **API not responding:** Check backend logs with `docker-compose logs backend`
- **Database connection:** Verify PostgreSQL container is running
- **Frontend cache:** Hard refresh browser (Ctrl+F5)

## Learning Objectives

This project demonstrates:
1. **Multi-container orchestration** with Docker Compose
2. **Service communication** between frontend, backend, and database
3. **Volume persistence** for database data
4. **Environment configuration** with Docker
5. **Real-time monitoring** and logging
6. **RESTful API design** with FastAPI
7. **Database integration** with PostgreSQL