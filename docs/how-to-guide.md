---
sidebar_position: 3
---

# How-To Guide

Step-by-step tutorials for common tasks.

## Creating a User

This guide walks you through creating a new user via the API.

### Prerequisites

- An API key (get one from your [dashboard](https://dashboard.acme.io/api-keys))
- A tool for making HTTP requests (curl, Postman, etc.)

### Step 1: Prepare the Request

Create a JSON payload with the user details:

```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "member"
}
```

**Available roles:** `admin`, `member`, `viewer`

### Step 2: Send the Request

Make a POST request to the users endpoint:

```bash
curl -X POST https://api.acme.io/v1/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "member"
  }'
```

### Step 3: Handle the Response

A successful request returns the created user:

```json
{
  "id": "usr_456",
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "member",
  "created_at": "2024-01-20T14:22:00Z",
  "updated_at": "2024-01-20T14:22:00Z"
}
```

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Invalid email format | Check the email address is valid |
| 400 | Invalid role | Use one of: admin, member, viewer |
| 401 | Unauthorized | Verify your API key is correct |
| 409 | Email already exists | Use a different email address |
| 429 | Rate limited | Wait and retry after 60 seconds |

## Updating a User

To update an existing user:

```bash
curl -X PATCH https://api.acme.io/v1/users/usr_456 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith-Jones",
    "role": "admin"
  }'
```

Only include the fields you want to update.

## Deleting a User

To delete a user:

```bash
curl -X DELETE https://api.acme.io/v1/users/usr_456 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Note:** This action is irreversible.

## Fetching User Details

To retrieve a specific user by ID:

```bash
curl -X GET https://api.acme.io/v1/users/usr_456 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Listing All Users

To list all users in your account:

```bash
curl -X GET https://api.acme.io/v1/users \
  -H "Authorization: Bearer YOUR_API_KEY"
```

The response includes pagination info:

```json
{
  "data": [...],
  "has_more": true,
  "total": 150,
  "next_cursor": "cur_abc123"
}
```

Use the cursor for pagination:

```bash
curl -X GET "https://api.acme.io/v1/users?cursor=cur_abc123" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
