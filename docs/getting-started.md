---
sidebar_position: 1
---

# Getting Started

Welcome to the Acme API! This guide will help you get up and running quickly.

## Base URL

All API requests should be made to:

```
https://api.acme.io/v1
```

## Authentication

Include your API key in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

You can obtain an API key from your [dashboard](https://dashboard.acme.io/api-keys).

## Endpoints

### Users

Manage user accounts in your application.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| POST | `/users` | Create a new user |
| GET | `/users/:id` | Get a user by ID |

#### Example: List Users

```bash
curl -X GET https://api.acme.io/v1/users \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:

```json
{
  "data": [
    {
      "id": "usr_123",
      "email": "john@example.com",
      "name": "John Doe",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "has_more": false
}
```

### Products

Manage your product catalog.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| POST | `/products` | Create a new product |
| GET | `/products/:id` | Get a product by ID |

#### Example: Create Product

```bash
curl -X POST https://api.acme.io/v1/products \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "price": 99.00,
    "currency": "USD"
  }'
```

## Next Steps

- Read the [Architecture Overview](./architecture) to understand our system
- Follow the [How-To Guide](./how-to-guide) for step-by-step tutorials
