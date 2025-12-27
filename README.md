# Multi-Tenant SaaS Authentication & Billing Platform

A production-grade, polyglot microservices platform for multi-tenant SaaS applications with OAuth2/OpenID Connect authentication, authorization, and usage-based billing.

## 🏗️ Architecture Overview

This monorepo implements a **microservices architecture** with:
- **Polyglot Services**: NestJS (TypeScript) + Go
- **Event-Driven**: Apache Kafka for async communication
- **gRPC**: High-performance inter-service communication
- **Multi-Tenant**: Complete data isolation per tenant
- **OAuth2/OIDC**: Industry-standard authentication
- **Docker-First**: Containerized for local dev and production

## 📁 Project Structure

```
.
├── services/                  # Microservices
│   ├── auth-gateway/          # NestJS - OAuth2/OIDC Gateway
│   ├── identity-service/      # Go - User & Org Management (gRPC)
│   ├── policy-service/        # Go - RBAC/ABAC (gRPC)
│   ├── billing-service/       # NestJS - Subscriptions & Payments
│   ├── usage-service/         # Go - Usage Tracking & Metering
│   └── audit-service/         # Go - Audit Logging
│
├── libs/                      # Shared Libraries
│   ├── proto/                 # gRPC Protocol Buffers
│   │   ├── common/v1/
│   │   ├── identity/v1/
│   │   └── policy/v1/
│   └── shared/                # Shared Code
│       ├── typescript/        # NestJS shared utilities
│       └── go/                # Go shared packages
│
├── infra/                     # Infrastructure as Code
│   ├── docker/                # Docker configurations
│   │   ├── Dockerfile.base.node
│   │   └── Dockerfile.base.go
│   └── cdk/                   # AWS CDK (ECS deployment)
│
├── docker-compose.yml         # Local development environment
└── README.md                  # This file
```

## 🎯 Services

### 1. **auth-gateway** (NestJS)
**Port**: 3000  
**Type**: HTTP REST API + OAuth2/OIDC Provider

**Responsibilities**:
- OAuth2 authorization server (authorization code, client credentials, refresh token flows)
- OpenID Connect provider (user authentication, SSO)
- JWT token issuance and validation
- Session management (Redis)
- API Gateway to downstream services
- Rate limiting & request validation
- Multi-tenant context injection

**Tech Stack**: NestJS, Passport.js, Redis, PostgreSQL

---

### 2. **identity-service** (Go + gRPC)
**Port**: 50051  
**Type**: gRPC Service

**Responsibilities**:
- User lifecycle management (CRUD)
- Organization/tenant management
- User-to-tenant relationship mapping
- Profile management
- Identity verification workflows
- Multi-tenant data isolation at DB level

**Tech Stack**: Go, gRPC, PostgreSQL

---

### 3. **policy-service** (Go + gRPC)
**Port**: 50052  
**Type**: gRPC Service

**Responsibilities**:
- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- Permission evaluation engine
- Policy CRUD operations
- Tenant-scoped permissions
- Resource-level authorization
- Policy caching (Redis)

**Tech Stack**: Go, gRPC, Redis, PostgreSQL

---

### 4. **billing-service** (NestJS)
**Port**: 3001  
**Type**: HTTP REST API

**Responsibilities**:
- Subscription management (create, upgrade, downgrade, cancel)
- Payment processing (Stripe/similar integration)
- Invoice generation
- Billing cycle orchestration
- Usage-based billing (consumption from usage-service)
- Webhook handling (payment provider events)
- Multi-tenant billing isolation

**Tech Stack**: NestJS, PostgreSQL, Kafka (events)

---

### 5. **usage-service** (Go)
**Port**: 8080  
**Type**: HTTP REST API

**Responsibilities**:
- API usage tracking (requests, compute time, storage)
- Resource consumption metering
- Real-time usage aggregation
- Quota enforcement
- Usage event ingestion (Kafka consumer)
- Time-series data storage
- Multi-tenant usage isolation

**Tech Stack**: Go, PostgreSQL (TimescaleDB extension), Kafka, Redis

---

### 6. **audit-service** (Go)
**Type**: Background Worker (Kafka Consumer)

**Responsibilities**:
- Audit event logging
- Compliance tracking (GDPR, SOC2)
- Security event monitoring
- Tamper-proof audit trails
- Event stream processing (Kafka)
- Log aggregation
- Tenant activity tracking

**Tech Stack**: Go, PostgreSQL, Kafka

---

## 🗄️ Infrastructure Components

### PostgreSQL
- **Multi-database setup**: Each service has its own database
- **Databases**: `auth_db`, `identity_db`, `policy_db`, `billing_db`, `usage_db`, `audit_db`
- **Multi-tenancy**: Row-level security (RLS) policies per service

### Redis
- **Session store**: OAuth2 sessions, refresh tokens
- **Cache**: Policy evaluations, user permissions
- **Rate limiting**: API throttling

### Apache Kafka
- **Topics**:
  - `usage.events`: API calls, resource usage
  - `billing.events`: Subscription changes, payments
  - `audit.events`: Security and compliance events
- **Use Cases**: Event-driven workflows, async processing, event sourcing

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local NestJS development)
- Go 1.21+ (for local Go development)
- AWS CLI (for CDK deployments)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd multi-tenant
   ```

2. **Start infrastructure**
   ```bash
   docker-compose up -d postgres redis kafka zookeeper
   ```

3. **Build and start services**
   ```bash
   docker-compose up --build
   ```

4. **Verify services**
   - Auth Gateway: http://localhost:3000
   - Billing Service: http://localhost:3001
   - Usage Service: http://localhost:8080
   - gRPC Services: Use tools like `grpcurl`

### Development Workflow

**For NestJS services**:
```bash
cd services/auth-gateway
npm install
npm run start:dev
```

**For Go services**:
```bash
cd services/identity-service
go mod download
go run main.go
```

---

## 🏛️ Multi-Tenancy Strategy

### Data Isolation
- **Database Level**: Each service uses PostgreSQL Row-Level Security (RLS)
- **Application Level**: Tenant ID injected via JWT claims
- **Network Level**: Tenant-specific API keys/secrets

### Tenant Context Flow
1. User authenticates via `auth-gateway`
2. JWT contains `tenant_id` claim
3. All services extract and validate `tenant_id`
4. Database queries automatically scoped to tenant

---

## 🔐 Authentication & Authorization Flow

### OAuth2 Flow (Authorization Code)
```
User → auth-gateway (login) → auth-gateway (consent)
     → auth-gateway (code) → Client App → auth-gateway (token)
     → JWT (contains tenant_id, user_id, scopes)
```

### Authorization Check
```
Client Request → auth-gateway (validate JWT)
              → policy-service.CheckPermission(user_id, resource, action)
              → Allow/Deny
```

---

## 📦 Shared Libraries

### `libs/proto`
- gRPC service definitions
- Shared message types
- Code generation for Go and TypeScript

### `libs/shared/typescript`
- JWT validation decorators
- Multi-tenant guards
- Exception filters
- Logging interceptors

### `libs/shared/go`
- gRPC auth middleware
- JWT parsing and validation
- Structured logging
- Database helpers

---

## ☁️ AWS Deployment (CDK)

### Infrastructure Stacks
1. **NetworkStack**: VPC, subnets, NAT gateways, security groups
2. **DatabaseStack**: RDS PostgreSQL Multi-AZ
3. **CacheStack**: ElastiCache Redis cluster
4. **MessagingStack**: Amazon MSK (Kafka)
5. **ServicesStack**: ECS Fargate services, Application Load Balancer, Auto Scaling

### Deploy to AWS
```bash
cd infra/cdk
npm install
cdk bootstrap
cdk deploy --all
```

---

## 🧪 Testing Strategy

### Unit Tests
- Each service has its own test suite
- NestJS: `npm run test`
- Go: `go test ./...`

### Integration Tests
- Docker Compose test environment
- End-to-end API tests

### Load Tests
- k6 or Locust for performance testing
- Test multi-tenant isolation under load

---

## 📊 Monitoring & Observability

**Planned Integrations**:
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: OpenTelemetry + Jaeger
- **APM**: DataDog or New Relic

---

## 🔒 Security Best Practices

- ✅ OAuth2/OIDC for authentication
- ✅ JWT with short expiry + refresh tokens
- ✅ HTTPS only (enforced via ALB)
- ✅ Rate limiting per tenant
- ✅ Audit logging for compliance
- ✅ Secrets management (AWS Secrets Manager)
- ✅ Database encryption at rest
- ✅ Multi-tenant data isolation (RLS)

---

## 📚 API Documentation

**OpenAPI/Swagger**:
- Auth Gateway: http://localhost:3000/api/docs
- Billing Service: http://localhost:3001/api/docs

**gRPC**:
- Use `grpcurl` or Postman gRPC feature
- Proto definitions in `libs/proto/`

---

## 🛠️ Technology Stack Summary

| Component | Technology |
|-----------|------------|
| **API Gateway** | NestJS, Express |
| **Microservices** | Go, NestJS |
| **Communication** | gRPC, REST, Kafka |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **Message Queue** | Apache Kafka |
| **Auth** | OAuth2, OpenID Connect, JWT |
| **Infrastructure** | Docker, AWS ECS, AWS CDK |
| **Monitoring** | Prometheus, Grafana, OpenTelemetry |

---

## 📝 License

Proprietary - All Rights Reserved

---

## 👥 Contributing

This is a production platform. For contribution guidelines, see `CONTRIBUTING.md` (to be created).

---

## 📧 Support

For issues or questions, contact the platform team.
