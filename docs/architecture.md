---
sidebar_position: 2
---

# Architecture Overview

The Acme platform is built on a modern microservices architecture designed for scalability and reliability.

## System Components

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API       │     │   Auth      │     │   Data      │
│   Gateway   │────▶│   Service   │────▶│   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                        │
      │                                        ▼
      │                               ┌─────────────┐
      └──────────────────────────────▶│  PostgreSQL │
                                      └─────────────┘
```

## Services

### API Gateway

The API Gateway is the entry point for all client requests. It handles:

- Request routing
- Authentication verification
- Request/response logging

### Auth Service

The Auth Service manages user authentication and authorization:

- API key validation
- Session management
- Permission checks

### Data Service

The Data Service handles all database operations:

- User CRUD operations
- Product management
- Data validation

## Data Flow

1. Client sends request to API Gateway
2. Gateway validates authentication with Auth Service
3. Valid requests are routed to Data Service
4. Data Service performs database operations
5. Response flows back through the Gateway

## Technology Stack

| Component | Technology |
|-----------|------------|
| API Gateway | Node.js / Express |
| Auth Service | Node.js / Express |
| Data Service | Node.js / Express |
| Database | PostgreSQL |
| Cache | Redis |

## Deployment

All services are deployed on AWS using:

- ECS for container orchestration
- RDS for managed PostgreSQL
- ElastiCache for Redis
