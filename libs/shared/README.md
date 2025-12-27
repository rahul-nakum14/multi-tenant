# Shared Libraries

This directory contains shared code and utilities used across multiple services.

## Structure

```
shared/
├── typescript/        (Shared TypeScript code for NestJS services)
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── utils/
└── go/                (Shared Go code)
    ├── middleware/
    ├── auth/
    ├── logger/
    └── database/
```

## TypeScript Shared

- **decorators**: Multi-tenant context, auth decorators
- **guards**: JWT validation, tenant isolation
- **interceptors**: Logging, error handling
- **filters**: Exception filters
- **utils**: Common utilities

## Go Shared

- **middleware**: gRPC interceptors, auth middleware
- **auth**: JWT validation, token parsing
- **logger**: Structured logging
- **database**: PostgreSQL helpers, migrations
