# Bookmarks Module Documentation

## Overview
This module handles question bookmarking, allowing users to:
- Save questions for later review
- Add personal notes to bookmarks
- Filter bookmarks by subject
- View bookmarks with pagination

**Security:** All endpoints require JWT authentication.

---

## Business Rules

| Rule | Free Users | Premium Users |
|------|------------|---------------|
| Bookmark limit | Max 20 | Unlimited |
| Expiry | 30 days | Never |
| Notes limit | 50 words (~300 chars) | Same |

---

## File Structure

| File | Purpose |
|------|---------|
| `bookmarks.plugin.ts` | Entry point - registers routes with Fastify |
| `bookmarks.routes.ts` | Defines API endpoints with validation schemas |
| `bookmarks.controller.ts` | Request handlers - extracts JWT user and delegates to service |
| `bookmarks.service.ts` | Business logic - database operations, limit checks, ownership validation |
| `bookmarks.schema.ts` | Zod validation schemas and TypeScript types |

---

## API Endpoints

### 1. Create Bookmark
**POST** `/api/bookmarks`

```json
{
  "questionId": 123,
  "examId": 45,         // optional
  "notes": "Review this" // optional, max 300 chars
}
```

### 2. List Bookmarks
**GET** `/api/bookmarks?page=1&limit=20&subject=Mathematics`

Returns paginated list with question details.

### 3. Get Bookmark
**GET** `/api/bookmarks/:id`

### 4. Update Bookmark
**PATCH** `/api/bookmarks/:id`

```json
{
  "notes": "Updated notes"
}
```

### 5. Delete Bookmark
**DELETE** `/api/bookmarks/:id`

---

## Testing

Use Swagger UI at `/api/docs` or test with cURL:

```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/bookmarks
```
