-- Migration: add_unique_report_constraint
-- Adds a unique constraint to prevent duplicate reports
-- (same user reporting the same issue type on the same question)
-- This was already applied via `prisma db push`, this file records it.

CREATE UNIQUE INDEX IF NOT EXISTS "QuestionReport_userId_questionId_issueType_key" 
ON "QuestionReport"("userId", "questionId", "issueType");
