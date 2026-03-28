# Auth Gateway

Multi-tenant SaaS Authentication & Authorization Gateway built with NestJS.

## Architecture

Production-grade modular architecture with:
- **TypeScript** in strict mode
- **Environment-based configuration** with validation
- **Structured JSON logging** (Winston)
- **Health checks** for liveness and readiness
- **Swagger API documentation**
- **Global validation** with class-validator
- **CORS** configuration
- **PostgreSQL** database support
- **Redis** caching support

## Folder Structure

```
src/
├── app.module.ts           # Main application module
├── main.ts                 # Bootstrap file
│
├── modules/                # Feature modules
│   ├── auth/              # Authentication (OAuth2/OIDC) - TODO
│   ├── users/             # User management - TODO
│   ├── tenants/           # Tenant/Organization management - TODO
│   └── health/            # Health check endpoints
│
├── common/                # Shared utilities
│   ├── config/           # Configuration (env validation)
│   ├── constants/        # Application constants
│   ├── decorators/       # Custom decorators
│   ├── guards/           # Auth guards
│   ├── interceptors/     # Logging, transform interceptors
│   ├── filters/          # Exception filters
│   └── middleware/       # Request ID, logging middleware
│
└── infra/                # Infrastructure
    ├── database/         # TypeORM configuration
    └── redis/            # Redis client configuration
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL (via docker-compose)
- Redis (via docker-compose)

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run start:dev
```

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm run start:prod
```

## API Documentation

Swagger UI available at:
```
http://localhost:3000/api/docs
```

## Health Checks

### Liveness
```
GET /health
```

### Readiness
```
GET /health/ready
```

## Key Features

### ✅ Implemented
- ConfigModule with environment validation
- Health checks (database)
- Structured logging (JSON)
- Global validation pipe
- Swagger API documentation
- CORS configuration
- Request ID middleware
- Exception filters
- Logging interceptor

### 🚧 TODO
- OAuth2/OIDC authentication
- JWT strategy and guards
- User management
- Tenant management
- Permission-based authorization
- Rate limiting
- API key authentication

## Development

### Run Tests
```bash
npm run test
npm run test:e2e
npm run test:cov
```

### Lint
```bash
npm run lint
```

### Format
```bash
npm run format
```

## Docker

### Build Image
```bash
docker build -t auth-gateway .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=secret \
  auth-gateway
```

## Engineering Standards

This service follows the standards defined in `/ENGINEERING.md`:
- One service, one database (auth_db)
- Structured logging with tenant_id
- Multi-tenant isolation at query level
- Environment-based configuration
- No business logic in this initial version

## Next Steps

1. Implement OAuth2/OIDC flows
2. Add JWT strategy and validation
3. Create user and tenant entities
4. Implement RBAC/ABAC authorization
5. Add rate limiting per tenant
6. Implement audit logging
