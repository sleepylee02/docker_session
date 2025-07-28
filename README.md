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