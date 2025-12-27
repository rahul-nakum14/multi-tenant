# Docker Compose Explained - Line by Line

This guide explains every line of the `docker-compose.yml` file in detail.

---

## Table of Contents
1. [File Header](#file-header)
2. [PostgreSQL Service](#postgresql-service)
3. [Redis Service](#redis-service)
4. [Zookeeper Service](#zookeeper-service)
5. [Kafka Service](#kafka-service)
6. [Networks](#networks)
7. [Volumes](#volumes)

---

## File Header

```yaml
version: '3.8'
```

**What it means**: Tells Docker which Compose file format version to use.

**Why '3.8'**: 
- Supports all features we need (health checks, named volumes, etc.)
- Compatible with Docker Engine 19.03.0+
- Industry standard for production setups

**Alternative versions**:
- `3.0` - Older, fewer features
- `3.9` - Latest in v3 family, but `3.8` is more widely supported

---

## PostgreSQL Service

### Service Name & Basic Config

```yaml
services:
  postgres:
```

**What it means**: Defines a service named `postgres`. 

**How to use**: Other services can connect using hostname `postgres` (e.g., `postgres:5432`)

---

```yaml
    image: postgres:15-alpine
```

**What it means**: Use official PostgreSQL 15 image based on Alpine Linux.

**Why Alpine**: 
- Tiny size (~80MB vs ~300MB for regular Ubuntu-based image)
- Secure (minimal attack surface)
- Perfect for local development

**Version**: `15` is the PostgreSQL version, `alpine` is the Linux distribution

---

```yaml
    container_name: saas-postgres
```

**What it means**: Give container a fixed name instead of random one.

**Without this**: Docker names it something like `multi-tenant-postgres-1`  
**With this**: Always named `saas-postgres`

**Benefits**:
- Easy to find: `docker ps | grep saas-postgres`
- Easy to exec: `docker exec -it saas-postgres psql -U postgres`

---

```yaml
    restart: unless-stopped
```

**What it means**: Automatically restart the container if it crashes.

**Options**:
- `no` - Never restart (default)
- `always` - Always restart, even after reboot
- `unless-stopped` - Restart unless you manually stopped it
- `on-failure` - Only restart if it crashes with error

**Why unless-stopped**: Best for development. If you stop it, it stays stopped. If it crashes, it restarts.

---

### Environment Variables

```yaml
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
```

**What it means**: Set environment variables inside the container.

**POSTGRES_USER**: Creates a superuser named `postgres`  
**POSTGRES_PASSWORD**: Sets password to `postgres` (change for production!)  
**POSTGRES_DB**: Creates initial database named `postgres`

**How PostgreSQL uses these**: The official image looks for these variables on first startup and configures the database accordingly.

---

### Ports

```yaml
    ports:
      - "5432:5432"
```

**What it means**: Map port 5432 from container to port 5432 on your computer.

**Format**: `"HOST_PORT:CONTAINER_PORT"`

**Example**:
- Container listens on port `5432` (right side)
- Your computer exposes it on port `5432` (left side)
- Connect from your laptop: `localhost:5432`

**If port 5432 is busy**: Change to `"5433:5432"` to use port 5433 on your computer instead.

---

### Volumes

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
```

**What it means**: Mount storage locations for persistent data and initialization scripts.

#### Line 1: Data Persistence
```yaml
postgres_data:/var/lib/postgresql/data
```

**Format**: `VOLUME_NAME:CONTAINER_PATH`

**What happens**:
- `postgres_data` - A named volume Docker creates
- `/var/lib/postgresql/data` - Where PostgreSQL stores all database files inside container

**Why this matters**: When container is deleted, data survives in the volume!

**Without this**: Deleting container = losing all data

#### Line 2: Initialization Script
```yaml
./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
```

**Format**: `HOST_PATH:CONTAINER_PATH`

**What happens**:
- `./scripts/init-databases.sh` - Script on your computer
- `/docker-entrypoint-initdb.d/` - Special directory PostgreSQL checks on first startup
- PostgreSQL runs any `.sh` scripts it finds there

**Our script creates**: 6 databases (auth_db, identity_db, etc.)

---

### Health Check

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**What it means**: Docker periodically checks if PostgreSQL is actually working.

**Line by line**:

```yaml
test: ["CMD-SHELL", "pg_isready -U postgres"]
```
- Run command `pg_isready -U postgres` inside container
- `pg_isready` is a PostgreSQL tool that checks if server accepts connections
- `-U postgres` checks as user `postgres`

```yaml
interval: 10s
```
- Run health check every 10 seconds

```yaml
timeout: 5s
```
- Wait max 5 seconds for health check to complete
- If it takes longer, consider it failed

```yaml
retries: 5
```
- Must pass 5 times in a row to be considered "healthy"
- Must fail 5 times in a row to be considered "unhealthy"

**Why this matters**: Other services can wait for PostgreSQL to be actually ready, not just started.

**Check health**: `docker ps` shows health status

---

### Network

```yaml
    networks:
      - saas-network
```

**What it means**: Connect this container to the `saas-network` network.

**Why**: All services on same network can talk to each other using service names as hostnames.

**Example**: Redis can connect to PostgreSQL using `postgres:5432`

---

## Redis Service

```yaml
  redis:
    image: redis:7-alpine
    container_name: saas-redis
    restart: unless-stopped
```

**Same as PostgreSQL**: Uses Redis 7 on Alpine, fixed container name, auto-restart policy.

---

### Redis Command

```yaml
    command: redis-server --requirepass redis_password --appendonly yes
```

**What it means**: Override the default Redis startup command with custom options.

**Breaking it down**:

```
redis-server
```
- The main Redis program

```
--requirepass redis_password
```
- Require password `redis_password` for all connections
- **Security**: Without this, anyone can access Redis with no authentication

```
--appendonly yes
```
- Enable AOF (Append-Only File) persistence
- **Data safety**: Every write operation is logged to disk
- **Alternative**: RDB (snapshot) - saves data periodically but could lose recent writes

**Without this line**: Redis runs with default settings (no password, no persistence).

---

### Redis Ports & Volumes

```yaml
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

**Port 6379**: Standard Redis port  
**Volume `/data`**: Where Redis stores the AOF file for persistence

---

### Redis Health Check

```yaml
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
```

**Command breakdown**:
```
redis-cli --raw incr ping
```
- `redis-cli` - Redis command-line client
- `--raw` - Return raw output (not formatted)
- `incr ping` - Increment a counter called "ping" (simple operation to test if Redis works)

**Simpler alternative**: Could use `redis-cli ping` but `incr` also tests write operations.

---

## Zookeeper Service

```yaml
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: saas-zookeeper
    restart: unless-stopped
```

**What is Zookeeper**: Coordination service that Kafka needs to manage its cluster.

**Think of it as**: Kafka's brain that tracks which brokers are alive, where topics are stored, etc.

**Image**: Confluent's official Zookeeper (company behind Enterprise Kafka)

---

### Zookeeper Configuration

```yaml
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_SYNC_LIMIT: 2
```

**ZOOKEEPER_CLIENT_PORT: 2181**
- Port where clients (Kafka) connect
- `2181` is the standard Zookeeper port

**ZOOKEEPER_TICK_TIME: 2000**
- Basic time unit in milliseconds
- Zookeeper uses this for heartbeats and timeouts
- `2000ms` = 2 seconds

**ZOOKEEPER_SYNC_LIMIT: 2**
- How many ticks to allow followers to sync with leader
- `2 ticks * 2000ms = 4 seconds` max sync time
- **Single instance**: Not critical for us, but good practice

---

### Zookeeper Volumes

```yaml
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_logs:/var/lib/zookeeper/log
```

**Why two volumes**:
- `/data` - Actual Zookeeper state (critical)
- `/log` - Transaction logs (also important)

**Best practice**: Separate volumes for data and logs in production.

---

## Kafka Service

```yaml
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: saas-kafka
    restart: unless-stopped
    depends_on:
      - zookeeper
```

**depends_on**: Start Zookeeper before Kafka.

**Important**: This only controls start order, NOT health. Zookeeper might not be ready when Kafka starts (that's why we added health checks).

---

### Kafka Environment Variables

#### Broker Identification

```yaml
    environment:
      KAFKA_BROKER_ID: 1
```

**What it means**: Unique ID for this Kafka broker.

**In a cluster**: Each broker gets different ID (1, 2, 3...)  
**Single broker**: Just use ID `1`

---

#### Zookeeper Connection

```yaml
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
```

**What it means**: Tell Kafka where to find Zookeeper.

**Format**: `hostname:port`  
**hostname**: `zookeeper` (service name from docker-compose)  
**port**: `2181` (Zookeeper's client port)

---

#### Listeners (CRITICAL CONCEPT)

```yaml
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
```

**What it means**: How clients can connect to Kafka.

**This is the MOST confusing part of Kafka**. Let me break it down:

**Two listeners**:
1. `PLAINTEXT://kafka:29092` - For Docker containers
2. `PLAINTEXT_HOST://localhost:9092` - For your laptop

**Why two**:
- Code running in Docker containers uses `kafka:29092`
- Code running on your laptop uses `localhost:9092`

**Example**:
```javascript
// Running in Docker container
kafka.connect('kafka:29092')

// Running on your laptop
kafka.connect('localhost:9092')
```

---

```yaml
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
```

**What it means**: Map listener names to security protocols.

**Format**: `LISTENER_NAME:PROTOCOL`

**Our mapping**:
- `PLAINTEXT` → `PLAINTEXT` (no encryption)
- `PLAINTEXT_HOST` → `PLAINTEXT` (no encryption)

**Production**: Would use `SSL:SSL` or `SASL_SSL:SASL_SSL` for encryption

---

```yaml
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
```

**What it means**: Which listener brokers use to talk to each other.

**Single broker**: Doesn't matter much  
**Cluster**: Critical for broker-to-broker communication

---

#### Replication Settings

```yaml
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
```

**What is replication**: How many copies of data to keep.

**Why all set to 1**: Single broker! Can't replicate to other brokers.

**Production (3 brokers)**: Would set to `3` for high availability.

**Breaking it down**:
- `OFFSETS_TOPIC_REPLICATION_FACTOR` - Consumer offset tracking
- `TRANSACTION_STATE_LOG_REPLICATION_FACTOR` - Transaction logs
- `TRANSACTION_STATE_LOG_MIN_ISR` - Minimum in-sync replicas

---

#### Topic Settings

```yaml
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
```

**What it means**: Automatically create topics when first message is sent.

**true**: Send to non-existent topic → Kafka creates it  
**false**: Must manually create all topics first

**Development**: `true` is convenient  
**Production**: Often `false` to prevent accidents

---

#### Log Retention

```yaml
      KAFKA_LOG_RETENTION_HOURS: 168
      KAFKA_LOG_SEGMENT_BYTES: 1073741824
```

**KAFKA_LOG_RETENTION_HOURS: 168**
- Keep messages for 168 hours (7 days)
- After 7 days, old messages are deleted
- **Production**: Might be 720 hours (30 days) or more

**KAFKA_LOG_SEGMENT_BYTES: 1073741824**
- 1073741824 bytes = 1 GB
- Kafka splits topic data into 1GB files
- When file hits 1GB, start new file
- **Technical**: Helps with data management and deletion

---

### Kafka Ports

```yaml
    ports:
      - "9092:9092"
      - "29092:29092"
```

**9092**: External access (from your laptop)  
**29092**: Internal access (from Docker containers)

**Why expose both**: Kafka needs to know which port you're using to advertise correct connection info.

---

### Kafka Health Check

```yaml
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 10s
      retries: 5
```

**Command**: `kafka-broker-api-versions --bootstrap-server localhost:9092`

**What it does**: Connect to Kafka and list API versions (simple test that everything works)

**timeout: 10s**: Kafka can be slow to start, so give it 10 seconds

---

## Networks

```yaml
networks:
  saas-network:
    driver: bridge
    name: saas-network
```

**What it means**: Create a network named `saas-network`.

**driver: bridge**:
- Default Docker network type
- Containers on same bridge can communicate
- Isolated from other Docker networks

**name: saas-network**:
- Explicit name instead of auto-generated `dirname_saas-network`
- Makes it easier to reference

**How containers communicate**:
```
postgres:5432  ← Service name becomes hostname
redis:6379
kafka:29092
zookeeper:2181
```

---

## Volumes

```yaml
volumes:
  postgres_data:
    name: saas_postgres_data
  redis_data:
    name: saas_redis_data
  zookeeper_data:
    name: saas_zookeeper_data
  zookeeper_logs:
    name: saas_zookeeper_logs
  kafka_data:
    name: saas_kafka_data
```

**What it means**: Define named volumes for persistent storage.

### Without explicit names:
Docker creates: `dirname_postgres_data`, `dirname_redis_data`

### With explicit names:
Docker creates: `saas_postgres_data`, `saas_redis_data`

**Benefits**:
- Consistent names regardless of directory name
- Easier to find: `docker volume ls | grep saas`
- Easier to backup: `docker run --rm -v saas_postgres_data:/data alpine tar czf backup.tar.gz /data`

---

## Quick Reference Table

| Service | Port | Volume | Why It Exists |
|---------|------|--------|---------------|
| **postgres** | 5432 | postgres_data | Store all databases |
| **redis** | 6379 | redis_data | Cache, sessions, rate limiting |
| **zookeeper** | 2181 | zookeeper_data | Coordinate Kafka cluster |
| **kafka** | 9092, 29092 | kafka_data | Event streaming |

---

## Common Patterns Explained

### Pattern 1: Image Tags
```yaml
image: postgres:15-alpine
       ^^^^^^  ^^ ^^^^^^
       name    |  variant
            version
```

### Pattern 2: Port Mapping
```yaml
ports:
  - "5432:5432"
     ^^^^  ^^^^
     host  container
```

### Pattern 3: Environment Arrays
```yaml
environment:
  KEY: value          # Object style
  - KEY=value         # Array style (alternative)
```

Both work the same way!

### Pattern 4: Volume Types
```yaml
volumes:
  - named_volume:/path       # Named volume (persistent)
  - ./host/path:/path        # Bind mount (sync with host)
  - /container/path          # Anonymous volume
```

---

## Testing Your Understanding

### Q1: How do you connect to PostgreSQL from your laptop?
**Answer**: `postgresql://postgres:postgres@localhost:5432/auth_db`

### Q2: How do you connect to Redis from a Docker container?
**Answer**: `redis://:redis_password@redis:6379`

### Q3: What happens if you run `docker-compose down -v`?
**Answer**: Deletes all containers AND volumes (data loss!)

### Q4: How do you check if all services are healthy?
**Answer**: `docker-compose ps` - look for "healthy" status

### Q5: Why does Kafka have two advertised listeners?
**Answer**: One for host access (localhost:9092), one for container access (kafka:29092)

---

## Next Steps

1. **Start services**: `docker-compose up -d`
2. **Check logs**: `docker-compose logs -f`
3. **Verify health**: `docker-compose ps`
4. **Test connections**: Use examples from QUICKSTART.md

---

## Getting Help

**View full config**: `docker-compose config`  
**Check errors**: `docker-compose logs <service-name>`  
**Restart a service**: `docker-compose restart postgres`  
**Rebuild**: `docker-compose up -d --build`

---

## Key Takeaways

1. **Services** = containers you want to run
2. **Networks** = how containers talk to each other
3. **Volumes** = where data is stored persistently
4. **Health checks** = ensure services are actually ready
5. **Environment variables** = configure container behavior
6. **Ports** = expose container services to your computer

That's it! You now understand every line of the docker-compose.yml file. 🎉
