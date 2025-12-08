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
| PATCH | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Archive a product |
| POST | `/products/:id/prices` | Add a price to product |

#### Product Types

Products can be one of these types:
- `one_time` - Single purchase products
- `recurring` - Subscription products with billing intervals

#### Example: Create Subscription Product

```bash
curl -X POST https://api.acme.io/v1/products \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "type": "recurring",
    "description": "Full access to all features",
    "metadata": {
      "features": ["unlimited_users", "priority_support"]
    }
  }'
```

#### Example: Add Price to Product

```bash
curl -X POST https://api.acme.io/v1/products/prod_123/prices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9900,
    "currency": "usd",
    "interval": "month"
  }'
```

### Webhooks

Receive real-time notifications about events in your account.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks` | List webhook endpoints |
| POST | `/webhooks` | Create a webhook endpoint |
| DELETE | `/webhooks/:id` | Delete a webhook endpoint |

#### Example: Create Webhook

```bash
curl -X POST https://api.acme.io/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks",
    "events": ["product.created", "product.updated"]
  }'
```

## Next Steps

- Read the [Architecture Overview](./architecture) to understand our system
- Follow the [How-To Guide](./how-to-guide) for step-by-step tutorials
