# Docker Infrastructure

This directory contains Docker-related configuration files for local development and production deployments.

## Contents

- **docker-compose.local.yml**: Local development stack
- **docker-compose.prod.yml**: Production-like environment
- **Dockerfile.base.node**: Base Node.js image with common dependencies
- **Dockerfile.base.go**: Base Go image with common dependencies
- **.dockerignore**: Files to exclude from Docker builds

## Services in Docker Compose

- PostgreSQL (multi-database setup for each service)
- Redis (session store, cache)
- Kafka + Zookeeper (event streaming)
- All microservices
