# AWS CDK Infrastructure

This directory contains AWS CDK code for deploying the platform to AWS ECS.

## Structure

```
cdk/
├── bin/
│   └── app.ts              (CDK app entry point)
├── lib/
│   ├── stacks/
│   │   ├── network-stack.ts
│   │   ├── database-stack.ts
│   │   ├── cache-stack.ts
│   │   ├── messaging-stack.ts
│   │   └── services-stack.ts
│   └── constructs/
│       ├── ecs-service.ts
│       └── alb-listener.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

## Stacks

- **NetworkStack**: VPC, subnets, NAT gateways, security groups
- **DatabaseStack**: RDS PostgreSQL (multi-tenant database)
- **CacheStack**: ElastiCache Redis cluster
- **MessagingStack**: Amazon MSK (Kafka) cluster
- **ServicesStack**: ECS Fargate services, ALB, auto-scaling

## Deployment

```bash
cdk deploy --all
```
