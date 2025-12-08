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

## Rate Limiting

All endpoints are rate limited to **100 requests per minute** per API key. When exceeded, you'll receive a `429 Too Many Requests` response.

## Endpoints

### Users

Manage user accounts in your application.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (paginated) |
| POST | `/users` | Create a new user |
| GET | `/users/:id` | Get a user by ID |
| PATCH | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

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
      "role": "admin",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "has_more": false,
  "total": 1
}
```

#### Example: Update User

```bash
curl -X PATCH https://api.acme.io/v1/users/usr_123 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "role": "member"
  }'
```

#### Example: Delete User

```bash
curl -X DELETE https://api.acme.io/v1/users/usr_123 \
  -H "Authorization: Bearer YOUR_API_KEY"
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

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMITED | Too many requests |

## Next Steps

- Read the [Architecture Overview](./architecture) to understand our system
- Follow the [How-To Guide](./how-to-guide) for step-by-step tutorials
