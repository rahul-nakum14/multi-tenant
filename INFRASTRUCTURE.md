# Local Infrastructure Setup

This document describes the local development infrastructure setup using Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM allocated to Docker
- 10GB free disk space

## Services

### PostgreSQL 15
**Port**: 5432  
**Image**: postgres:15-alpine  
**Credentials**: postgres/postgres

**Databases Created**:
- `auth_db` - Authentication service
- `identity_db` - Identity service  
- `policy_db` - Policy service
- `billing_db` - Billing service
- `usage_db` - Usage service
- `audit_db` - Audit service

**Connection String Example**:
```
postgresql://postgres:postgres@localhost:5432/auth_db
```

**Volume**: `saas_postgres_data`

---

### Redis 7
**Port**: 6379  
**Image**: redis:7-alpine  
**Password**: redis_password

**Persistence**: AOF (Append-Only File) enabled

**Connection String Example**:
```
redis://:redis_password@localhost:6379
```

**Volume**: `saas_redis_data`

---

### Apache Kafka
**Ports**: 
- 9092 (external access)
- 29092 (internal container access)

**Image**: confluentinc/cp-kafka:7.5.0

**Broker ID**: 1  
**Replication Factor**: 1 (single broker for local dev)

**Important Topics** (auto-created):
- `usage.events` - Usage tracking events
- `billing.events` - Billing lifecycle events
- `audit.events` - Security and compliance events

**Connection from host**: `localhost:9092`  
**Connection from containers**: `kafka:29092`

**Volume**: `saas_kafka_data`

---

### Zookeeper
**Port**: 2181  
**Image**: confluentinc/cp-zookeeper:7.5.0

**Purpose**: Kafka cluster coordination

**Volumes**: 
- `saas_zookeeper_data`
- `saas_zookeeper_logs`

---

## Quick Start

### Start All Services
```bash
docker-compose up -d
```

### Check Service Health
```bash
docker-compose ps
```

All services should show "healthy" status after 30-60 seconds.

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f postgres
docker-compose logs -f kafka
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (CAUTION: Data Loss)
```bash
docker-compose down -v
```

---

## Service Verification

### PostgreSQL
```bash
docker exec -it saas-postgres psql -U postgres -c "\l"
```

Expected output: List of 7 databases (postgres + 6 service databases)

### Redis
```bash
docker exec -it saas-redis redis-cli -a redis_password ping
```

Expected output: `PONG`

### Kafka
```bash
docker exec -it saas-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### Zookeeper
```bash
docker exec -it saas-zookeeper zkCli.sh ls /brokers/ids
```

Expected output: `[1]` (broker ID)

---

## Connection Details for Applications

Copy `.env.example` to `.env` and use the provided values:

```bash
cp .env.example .env
```

### Database Connections

Each service should use its dedicated database:

**auth-gateway**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
```

**identity-service**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/identity_db
```

**policy-service**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/policy_db
```

**billing-service**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_db
```

**usage-service**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/usage_db
```

**audit-service**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/audit_db
```

### Redis Connection

```
REDIS_URL=redis://:redis_password@localhost:6379
```

### Kafka Connection

**From host** (local development, running services outside Docker):
```
KAFKA_BROKERS=localhost:9092
```

**From Docker containers**:
```
KAFKA_BROKERS=kafka:29092
```

---

## Troubleshooting

### Kafka fails to start
- Ensure Zookeeper is healthy first
- Check Docker has enough memory (minimum 2GB)
- Wait 30 seconds after Zookeeper starts

### PostgreSQL connection refused
- Verify container is running: `docker ps | grep postgres`
- Check health: `docker inspect saas-postgres | grep Health`
- View logs: `docker-compose logs postgres`

### Redis authentication errors
- Ensure you're using password: `redis_password`
- Connect with: `redis-cli -a redis_password`

### Port conflicts
If ports are already in use, modify the left side of port mappings in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Use 5433 instead of 5432
```

---

## Performance Tuning

### PostgreSQL

For better local performance, add to `docker-compose.yml`:

```yaml
command:
  - postgres
  - -c
  - shared_buffers=256MB
  - -c
  - max_connections=200
```

### Kafka

Default settings are optimized for local development. For production-like testing, increase resources in Docker Desktop settings.

---

## Network

All services share the `saas-network` bridge network, allowing inter-container communication using service names as hostnames.

**Network name**: `saas-network`

---

## Data Persistence

All data is persisted in named Docker volumes. Data survives container restarts but not `docker-compose down -v`.

**Volumes**:
- `saas_postgres_data` - PostgreSQL data
- `saas_redis_data` - Redis data
- `saas_kafka_data` - Kafka logs and topics
- `saas_zookeeper_data` - Zookeeper state
- `saas_zookeeper_logs` - Zookeeper transaction logs

### Backup Volumes

```bash
docker run --rm -v saas_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Restore Volumes

```bash
docker run --rm -v saas_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

---

## Health Checks

All services include health checks. Use this to ensure infrastructure is ready:

```bash
#!/bin/bash
until docker-compose ps | grep -q "healthy"; do
  echo "Waiting for services to be healthy..."
  sleep 5
done
echo "All services are healthy!"
```

---

## Cleanup

### Remove all containers and networks (keep volumes)
```bash
docker-compose down
```

### Remove everything including volumes
```bash
docker-compose down -v
rm -rf postgres_data redis_data kafka_data zookeeper_data zookeeper_logs
```

### Remove all related Docker resources
```bash
docker-compose down -v --remove-orphans
docker network prune -f
docker volume prune -f
```
