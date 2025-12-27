# Shared Proto Definitions

This directory contains shared gRPC Protocol Buffer definitions used across all services.

## Structure

```
proto/
├── identity/
│   └── v1/
│       └── identity.proto
├── policy/
│   └── v1/
│       └── policy.proto
├── common/
│   └── v1/
│       └── common.proto
└── buf.yaml (or buf.gen.yaml for code generation)
```

## Services

- **identity/v1**: User and organization management definitions
- **policy/v1**: Authorization and access control definitions
- **common/v1**: Shared types (pagination, metadata, errors)

## Code Generation

Proto files will be compiled to:
- Go: Generated in each Go service's `pb/` directory
- TypeScript: Generated for NestJS services
