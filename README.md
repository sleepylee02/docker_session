# 도커 Todo 앱 실행 가이드 (Python 백엔드)

이 프로젝트는 도커의 핵심 개념을 실습할 수 있는 간단한 3-tier 웹 애플리케이션입니다.

## 프로젝트 구조
```
docker-todo-app/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── nginx.conf
│   └── Dockerfile
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 필요 사항
- Docker
- Docker Compose

## 실행 방법

1. 프로젝트 디렉토리로 이동
```bash
cd docker-todo-app
```

2. 모든 서비스 빌드 및 실행
```bash
sudo docker 
sudo docker-compose up --build
```

3. 브라우저에서 http://localhost:8080 접속

## 주요 도커 명령어

### 서비스 상태 확인
```bash
docker-compose ps
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
```

### 컨테이너 내부 접속
```bash
# 백엔드 컨테이너 셸 접속
docker-compose exec backend bash

# 데이터베이스 접속
docker-compose exec db psql -U todouser -d tododb
```

### 서비스 중지
```bash
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

## 기술 스택

- **Frontend**: HTML/CSS/JavaScript + Nginx
- **Backend**: Python 3.11 + FastAPI
- **Database**: PostgreSQL 15
- **Container**: Docker + Docker Compose

## 학습 포인트

1. **이미지 빌드**: Dockerfile을 통한 커스텀 이미지 생성
2. **네트워킹**: 컨테이너 간 통신 (frontend → backend → db)
3. **볼륨**: PostgreSQL 데이터 영속성
4. **환경 변수**: 데이터베이스 연결 정보 전달
5. **헬스 체크**: 서비스 준비 상태 확인
6. **의존성 관리**: depends_on을 통한 시작 순서 제어

## 문제 해결

### 백엔드가 데이터베이스에 연결할 수 없는 경우
```bash
# 데이터베이스 로그 확인
docker-compose logs db

# 네트워크 확인
docker network ls
docker network inspect docker-todo-app_todo-network
```

### 포트 충돌이 발생하는 경우
- 80번 포트: frontend를 다른 포트로 변경 (예: "8080:80")
- 5000번 포트: backend를 다른 포트로 변경 (예: "5001:5000")
- 5432번 포트: PostgreSQL을 다른 포트로 변경 (예: "5433:5432")

---

# 📚 API Documentation (Swagger)

이 섹션은 Todo App의 REST API에 대한 완전한 문서입니다. 모든 엔드포인트, 요청/응답 형식, 그리고 실제 사용 예제를 포함합니다.

## 🔗 API Base URL
```
http://localhost:5000/api
```

## 📋 Interactive Documentation
애플리케이션 실행 후 다음 URL에서 인터랙티브 API 문서를 확인할 수 있습니다:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## 🛠️ API Endpoints Overview

### Health Check & Monitoring
- `GET /health` - 서비스 헬스 체크
- `GET /api/logs` - 시스템 로그 조회
- `GET /api/database/structure` - 데이터베이스 구조 조회

### Todo Operations
- `GET /api/todos` - 모든 할 일 조회
- `POST /api/todos` - 새 할 일 생성
- `PUT /api/todos/{id}/toggle` - 할 일 완료 상태 토글
- `DELETE /api/todos/{id}` - 할 일 삭제

---

## 📖 Detailed API Reference

### 🏥 Health Check

#### `GET /health`
서비스의 현재 상태를 확인합니다.

**Response:**
```json
{
  "status": "ok",
  "service": "backend",
  "timestamp": "2025-01-15T10:30:00.123456"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/health
```

---

### 📊 System Monitoring

#### `GET /api/logs`
최근 HTTP 요청 로그를 조회합니다 (최대 50개).

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-15T10:30:00.123456",
      "method": "GET",
      "url": "http://localhost:5000/api/todos",
      "client_ip": "172.18.0.1",
      "user_agent": "Mozilla/5.0...",
      "status_code": 200,
      "process_time_ms": 45.67,
      "response_size": "1024"
    }
  ],
  "total_requests": 127
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/logs
```

#### `GET /api/database/structure`
데이터베이스 테이블 구조와 샘플 데이터를 조회합니다.

**Response:**
```json
{
  "table_name": "todos",
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO",
      "column_default": "nextval('todos_id_seq'::regclass)"
    },
    {
      "column_name": "title",
      "data_type": "character varying",
      "is_nullable": "NO",
      "column_default": null
    },
    {
      "column_name": "completed",
      "data_type": "boolean",
      "is_nullable": "YES",
      "column_default": "false"
    },
    {
      "column_name": "created_at",
      "data_type": "timestamp without time zone",
      "is_nullable": "YES",
      "column_default": "CURRENT_TIMESTAMP"
    },
    {
      "column_name": "due_date",
      "data_type": "date",
      "is_nullable": "YES",
      "column_default": null
    }
  ],
  "total_rows": 15,
  "sample_data": [
    {
      "id": 1,
      "title": "Docker 학습하기",
      "completed": false,
      "created_at": "2025-01-15T10:30:00",
      "due_date": "2025-01-20"
    }
  ]
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/database/structure
```

---

### ✅ Todo Management

#### `GET /api/todos`
모든 할 일 항목을 최신순으로 조회합니다.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Docker 컨테이너 실습",
    "completed": false,
    "created_at": "2025-01-15T10:30:00.123456",
    "due_date": "2025-01-20T00:00:00"
  },
  {
    "id": 2,
    "title": "FastAPI 문서 읽기",
    "completed": true,
    "created_at": "2025-01-14T15:20:00.123456",
    "due_date": null
  }
]
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/todos \
  -H "Content-Type: application/json"
```

**JavaScript fetch:**
```javascript
const response = await fetch('http://localhost:5000/api/todos');
const todos = await response.json();
console.log(todos);
```

#### `POST /api/todos`
새로운 할 일 항목을 생성합니다.

**Request Body:**
```json
{
  "title": "새로운 할 일",
  "due_date": "2025-01-25"
}
```

**Request Schema:**
- `title` (string, required): 할 일 제목 (빈 문자열 불가)
- `due_date` (string, optional): 마감일 (YYYY-MM-DD 형식)

**Response (201 Created):**
```json
{
  "id": 3,
  "title": "새로운 할 일",
  "completed": false,
  "created_at": "2025-01-15T10:30:00.123456",
  "due_date": "2025-01-25T00:00:00"
}
```

**Error Responses:**
- `400 Bad Request`: 제목이 비어있거나 날짜 형식이 잘못된 경우
- `500 Internal Server Error`: 데이터베이스 오류

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Docker Compose 학습",
    "due_date": "2025-01-25"
  }'
```

**JavaScript fetch:**
```javascript
const response = await fetch('http://localhost:5000/api/todos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'React 컴포넌트 만들기',
    due_date: '2025-02-01'
  })
});
const newTodo = await response.json();
```

#### `PUT /api/todos/{id}/toggle`
할 일의 완료 상태를 토글(완료 ↔ 미완료)합니다.

**Path Parameters:**
- `id` (integer): 할 일 항목의 고유 ID

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Docker 컨테이너 실습",
  "completed": true,
  "created_at": "2025-01-15T10:30:00.123456",
  "due_date": "2025-01-20T00:00:00"
}
```

**Error Responses:**
- `404 Not Found`: 해당 ID의 할 일이 존재하지 않음
- `500 Internal Server Error`: 데이터베이스 오류

**Example cURL:**
```bash
curl -X PUT http://localhost:5000/api/todos/1/toggle \
  -H "Content-Type: application/json"
```

**JavaScript fetch:**
```javascript
const response = await fetch(`http://localhost:5000/api/todos/1/toggle`, {
  method: 'PUT'
});
const updatedTodo = await response.json();
```

#### `DELETE /api/todos/{id}`
할 일 항목을 영구적으로 삭제합니다.

**Path Parameters:**
- `id` (integer): 삭제할 할 일 항목의 고유 ID

**Response (204 No Content):**
빈 응답 본문 (삭제 성공)

**Error Responses:**
- `404 Not Found`: 해당 ID의 할 일이 존재하지 않음
- `500 Internal Server Error`: 데이터베이스 오류

**Example cURL:**
```bash
curl -X DELETE http://localhost:5000/api/todos/1
```

**JavaScript fetch:**
```javascript
const response = await fetch(`http://localhost:5000/api/todos/1`, {
  method: 'DELETE'
});
// 204 상태 코드 확인
if (response.status === 204) {
  console.log('삭제 성공');
}
```

---

## 📝 Data Models

### TodoCreate (Request)
새 할 일 생성 시 사용하는 모델:
```json
{
  "title": "string (required, non-empty)",
  "due_date": "string (optional, YYYY-MM-DD format)"
}
```

### TodoResponse (Response)
API 응답에서 사용하는 할 일 모델:
```json
{
  "id": "integer (unique identifier)",
  "title": "string (todo title)",
  "completed": "boolean (completion status)",
  "created_at": "datetime (ISO format)",
  "due_date": "datetime or null (ISO format)"
}
```

---

## 🔧 Error Handling

모든 API 엔드포인트는 일관된 오류 응답 형식을 사용합니다:

### Error Response Format
```json
{
  "detail": "에러 메시지 (한국어)"
}
```

### Common HTTP Status Codes
- `200 OK`: 요청 성공
- `201 Created`: 리소스 생성 성공
- `204 No Content`: 삭제 성공 (응답 본문 없음)
- `400 Bad Request`: 잘못된 요청 데이터
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류

### Example Error Responses

**400 Bad Request:**
```json
{
  "detail": "제목이 필요합니다"
}
```

**404 Not Found:**
```json
{
  "detail": "할 일을 찾을 수 없습니다"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "데이터베이스 연결 실패: connection timeout"
}
```

---

## 🧪 Testing the API

### Using curl
```bash
# 1. 모든 할 일 조회
curl -X GET http://localhost:5000/api/todos

# 2. 새 할 일 생성
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "API 테스트", "due_date": "2025-02-01"}'

# 3. 할 일 상태 토글 (ID: 1)
curl -X PUT http://localhost:5000/api/todos/1/toggle

# 4. 할 일 삭제 (ID: 1)
curl -X DELETE http://localhost:5000/api/todos/1

# 5. 헬스 체크
curl -X GET http://localhost:5000/health
```

### Using HTTPie
```bash
# HTTPie를 사용한 더 간단한 API 테스트
http GET localhost:5000/api/todos
http POST localhost:5000/api/todos title="HTTPie 테스트" due_date="2025-02-15"
http PUT localhost:5000/api/todos/1/toggle
http DELETE localhost:5000/api/todos/1
```

### Using JavaScript/Frontend
```javascript
// 완전한 CRUD 예제
class TodoAPI {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async getAllTodos() {
    const response = await fetch(`${this.baseURL}/todos`);
    return response.json();
  }

  async createTodo(title, dueDate = null) {
    const response = await fetch(`${this.baseURL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, due_date: dueDate })
    });
    return response.json();
  }

  async toggleTodo(id) {
    const response = await fetch(`${this.baseURL}/todos/${id}/toggle`, {
      method: 'PUT'
    });
    return response.json();
  }

  async deleteTodo(id) {
    const response = await fetch(`${this.baseURL}/todos/${id}`, {
      method: 'DELETE'
    });
    return response.status === 204;
  }
}

// 사용 예제
const api = new TodoAPI();
const todos = await api.getAllTodos();
const newTodo = await api.createTodo('JavaScript API 테스트', '2025-02-20');
```

---

## 🔍 Database Schema

### todos 테이블
```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE
);
```

### 인덱스 및 제약조건
- `id`: Primary Key, 자동 증가
- `title`: NULL 불가, 최대 255자
- `completed`: 기본값 FALSE
- `created_at`: 기본값 현재 시간
- `due_date`: NULL 허용

---

## 🌐 CORS Configuration

이 API는 개발 환경에서 모든 오리진을 허용하도록 구성되어 있습니다:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 구체적인 도메인 지정 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

프로덕션 환경에서는 보안을 위해 `allow_origins`를 구체적인 도메인으로 제한하는 것을 권장합니다.

---

## 🔐 Authentication & Security

현재 버전은 개발/학습 목적으로 인증이 구현되어 있지 않습니다. 프로덕션 환경에서는 다음을 고려해야 합니다:

- JWT 토큰 기반 인증
- API 키 인증
- 레이트 리미팅
- Input validation & sanitization
- HTTPS 사용 강제

---

## 📈 Performance Considerations

- 모든 API 요청은 로깅되며 처리 시간이 기록됩니다
- 데이터베이스 연결은 요청마다 새로 생성됩니다 (프로덕션에서는 커넥션 풀 사용 권장)
- 로그는 메모리에 최대 100개까지 저장됩니다

---

이 문서가 Todo App API를 이해하고 사용하는 데 도움이 되기를 바랍니다. 추가 질문이나 개선사항이 있다면 언제든 말씀해 주세요! 🚀