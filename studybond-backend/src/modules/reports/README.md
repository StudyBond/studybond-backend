# Reports Module

## Overview
The Reports module allows users to flag issues with questions in the StudyBond platform. Users can report problems such as wrong answers, typos, ambiguous wording, or missing images.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reports` | Create a new question report |
| GET | `/api/reports` | List your reports (paginated) |
| GET | `/api/reports/:id` | Get a single report by ID |
| DELETE | `/api/reports/:id` | Delete a pending report |

All endpoints require JWT authentication.

## Business Rules

- **Issue types**: `WRONG_ANSWER`, `TYPO`, `AMBIGUOUS`, `IMAGE_MISSING`, `OTHER`
- **Duplicate prevention**: One report per user per question per issue type
- **Ownership**: Users can only view and delete their own reports
- **Deletion restriction**: Only reports with `PENDING` status can be deleted
- **Description limit**: Max 500 characters

## Query Parameters (GET /api/reports)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| status | string | - | Filter by status (PENDING, REVIEWED, RESOLVED) |

## Architecture

```
reports.routes.ts → reports.controller.ts → reports.service.ts → Prisma (QuestionReport)
```
