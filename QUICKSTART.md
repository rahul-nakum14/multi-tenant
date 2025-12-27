# Infrastructure Quick Reference

## Start Infrastructure
```bash
docker-compose up -d
```

## Check Status
```bash
docker-compose ps
```

## View Logs
```bash
docker-compose logs -f
```

## Stop Infrastructure
```bash
docker-compose down
```

## Service Endpoints

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | postgres/postgres |
| Redis | 6379 | Password: redis_password |
| Kafka | 9092 | No auth |
| Zookeeper | 2181 | No auth |

## Database Connections

```bash
# auth-gateway
postgresql://postgres:postgres@localhost:5432/auth_db

# identity-service
postgresql://postgres:postgres@localhost:5432/identity_db

# policy-service
postgresql://postgres:postgres@localhost:5432/policy_db

# billing-service
postgresql://postgres:postgres@localhost:5432/billing_db

# usage-service
postgresql://postgres:postgres@localhost:5432/usage_db

# audit-service
postgresql://postgres:postgres@localhost:5432/audit_db
```

## Redis Connection
```bash
redis://:redis_password@localhost:6379
```

## Kafka Connection
```bash
# From host
localhost:9092

# From Docker containers
kafka:29092
```

## Verify Services

```bash
# PostgreSQL
docker exec -it saas-postgres psql -U postgres -c "\l"

# Redis
docker exec -it saas-redis redis-cli -a redis_password ping

# Kafka
docker exec -it saas-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

## Complete Cleanup
```bash
docker-compose down -v
```

## Volumes
- saas_postgres_data
- saas_redis_data
- saas_kafka_data
- saas_zookeeper_data
- saas_zookeeper_logs
