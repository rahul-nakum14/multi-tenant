# Multi-Tenant Identity, Authorization & Billing Platform

A production-grade, developer-focused SaaS platform that provides
**authentication, authorization, multi-tenancy, and billing**
for B2B SaaS products.

This project is intentionally designed as a **real-world backend system**,
not a demo or CRUD app.

It combines **OAuth2 / OpenID Connect**, **microservices**, **Kafka**, **gRPC**,
**Stripe billing**, and **full observability** to mirror how modern SaaS
infrastructure is built at scale.

---

## 🚀 What This Platform Provides

### Core Capabilities
- Multi-tenant authentication (organizations, users, roles)
- OAuth2 + OpenID Connect (OIDC) identity provider
- Role-Based & Attribute-Based Authorization (RBAC / ABAC)
- Subscription billing with Stripe
- Usage-based metering & quotas
- Audit logs & security events
- Admin & tenant-facing dashboards

This platform is comparable to a **mini Auth0 + Clerk + Stripe Billing** system.

---

## 🧠 Why This Project Exists

Most SaaS projects fail to demonstrate:
- Real authentication flows
- Tenant isolation
- Billing correctness
- Event-driven architecture
- Observability

This project **intentionally covers all of them** to:
- Deepen backend engineering knowledge
- Serve as a senior-level portfolio project
- Be launchable as a real SaaS (Product Hunt–ready)

---

## 🧱 System Architecture

### High-Level Overview

- **Public clients** authenticate via OAuth2 / OIDC
- **Auth Gateway** issues JWTs with tenant context
- **Microservices** communicate via gRPC
- **Kafka** is used for async workflows & audit events
- **Stripe** handles subscriptions & usage billing
- **Redis** provides caching, sessions, rate limits
- **PostgreSQL** is the source of truth
- **OpenTelemetry + CloudWatch** provide observability

---

## 🧩 Microservices Breakdown

### 1️⃣ Auth Gateway (NestJS)
**Public-facing authentication service**

Responsibilities:
- Email/password authentication
- OAuth2 authorization flows
- OpenID Connect token issuance
- JWT & refresh token management
- Token introspection & revocation

Tech:
- NestJS (TypeScript)
- OAuth2 / OIDC
- JWT + JWK
- PostgreSQL
- Redis

---

### 2️⃣ Identity & Tenant Service (Go)
**Core multi-tenancy service**

Responsibilities:
- Users
- Organizations (tenants)
- Memberships
- Tenant isolation rules

Tech:
- Go
- gRPC
- PostgreSQL
- Redis (caching)

---

### 3️⃣ Authorization / Policy Service (Go)
**Central authorization engine**

Responsibilities:
- RBAC & ABAC decisions
- Permission evaluation
- Stateless authorization checks

Tech:
- Go
- gRPC
- PostgreSQL
- Policy engine (OPA-style)

---

### 4️⃣ Billing & Subscription Service (NestJS)
**Billing orchestration**

Responsibilities:
- Stripe customer creation
- Subscription lifecycle
- Webhook processing
- Plan & entitlement enforcement

Tech:
- NestJS
- Stripe SDK
- PostgreSQL
- Kafka producer

---

### 5️⃣ Usage & Metering Service (Go)
**Usage tracking & quotas**

Responsibilities:
- Track API usage per tenant
- Enforce limits
- Emit billing & usage events

Tech:
- Go
- Kafka consumer
- Redis counters
- PostgreSQL rollups

---

### 6️⃣ Audit & Event Service
**Security & compliance**

Responsibilities:
- Immutable audit logs
- Login & security events
- Billing changes
- Event replay

Tech:
- Kafka
- PostgreSQL / OpenSearch
- S3 (archival)

---

## 🔗 Communication Patterns

| Interaction | Technology |
|------------|------------|
| Client → Auth | REST / OAuth2 |
| Auth → Client | JWT / OIDC |
| Service → Service | gRPC |
| Async workflows | Kafka |
| Caching & limits | Redis |
| Persistence | PostgreSQL |

---

## 🔐 Multi-Tenancy Model

- Organization = Tenant
- Users can belong to multiple organizations
- Tokens always include `org_id`
- All queries are tenant-scoped
- Billing is organization-based
- Rate limits & quotas are tenant-aware

This ensures **strict tenant isolation**.

---

## 💳 Billing & Monetization

- Stripe subscriptions per organization
- Plan-based feature access
- Usage-based billing support
- Secure webhook handling
- Billing events propagated via Kafka

---

## 📊 Observability & Reliability

- OpenTelemetry (Node.js + Go)
- Distributed tracing
- Structured logging
- CloudWatch metrics
- Kafka consumer lag monitoring

Observability is a **first-class feature**, not an afterthought.

---

## ☁️ Infrastructure & Deployment

- AWS CDK (TypeScript)
- ECS Fargate
- RDS (PostgreSQL)
- MSK (Kafka)
- ElastiCache (Redis)
- CloudWatch Logs & Metrics

Infrastructure is fully defined as code.

---

## 🗂️ Repository Structure

