# Architecture: Supabase Schema (PostgreSQL)

This document defines the database schema for the Onyx Club platform.
**Core Principle:** All data is isolated by `tenant_id` (Project/Client) except for global user profiles.

## 1. Authentication & Users

### `profiles`
Extends the default `auth.users` table.
- `id` (uuid, PK): References `auth.users.id`
- `email` (text): Copied from auth for easier querying
- `full_name` (text)
- `avatar_url` (text)
- `role` (text): 'USER' | 'ADMIN' | 'SUPER_ADMIN' (Global role, mostly for system admins)
- `created_at` (timestamp)

## 2. Multi-Tenancy (Clients/Projects)

### `tenants`
Represents the "Client Area" or "Project" selected at `ClientSelect`.
- `id` (uuid, PK)
- `name` (text): e.g., "Lançamento Expert X"
- `slug` (text, unique): for URLs
- `owner_id` (uuid): References `profiles.id`
- `created_at` (timestamp)

### `tenant_members`
Links users to tenants with specific permissions.
- `tenant_id` (uuid, FK)
- `user_id` (uuid, FK)
- `role` (text): 'OWNER' | 'EDITOR' | 'VIEWER'
- `joined_at` (timestamp)
- **PK:** (tenant_id, user_id)

## 3. Core Features (Tenant Scoped)

### `tasks` (Kanban)
- `id` (uuid, PK)
- `tenant_id` (uuid, FK): **CRITICAL for RLS**
- `title` (text)
- `description` (text)
- `status` (text): 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
- `assignee_id` (uuid, FK): References `profiles.id`
- `due_date` (timestamp)
- `created_at` (timestamp)

### `task_comments`
- `id` (uuid, PK)
- `task_id` (uuid, FK)
- `user_id` (uuid, FK)
- `content` (text)
- `created_at` (timestamp)

### `leads` (CRM)
- `id` (uuid, PK)
- `tenant_id` (uuid, FK)
- `name` (text)
- `email` (text)
- `company` (text)
- `value` (numeric): Stored as decimal/numeric
- `status` (text): 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST'
- `last_contact` (timestamp)
- `created_at` (timestamp)

### `posts` (Community Feed)
- `id` (uuid, PK)
- `tenant_id` (uuid, FK)
- `author_id` (uuid, FK)
- `title` (text)
- `content` (text)
- `pinned` (boolean)
- `likes_count` (int, default 0)
- `comments_count` (int, default 0)
- `created_at` (timestamp)

## 4. Learning Management (LMS)

### `modules`
- `id` (uuid, PK)
- `tenant_id` (uuid, FK)
- `title` (text)
- `description` (text)
- `image_url` (text)
- `order_index` (int): For sorting
- `created_at` (timestamp)

### `lessons`
- `id` (uuid, PK)
- `module_id` (uuid, FK)
- `title` (text)
- `duration` (text): e.g., "10:00"
- `type` (text): 'VIDEO' | 'TEXT' | 'DOCUMENT'
- `content_url` (text): Video URL or Doc link
- `order_index` (int)
- `created_at` (timestamp)

### `lesson_progress`
Tracks which user completed which lesson.
- `user_id` (uuid, FK)
- `lesson_id` (uuid, FK)
- `is_completed` (boolean)
- `updated_at` (timestamp)
- **PK:** (user_id, lesson_id)

## 5. Finance

### `financial_goals`
- `id` (uuid, PK)
- `tenant_id` (uuid, FK)
- `target_amount` (numeric)
- `start_date` (date)
- `created_at` (timestamp)

### `transactions`
- `id` (uuid, PK)
- `tenant_id` (uuid, FK)
- `customer_name` (text)
- `product_name` (text)
- `amount` (numeric)
- `status` (text): 'APPROVED' | 'PENDING' | 'REFUNDED'
- `date` (timestamp)

### `sales_metrics` (Optional/Cached)
Can be calculated on the fly, or stored for performance.
- `tenant_id` (uuid, PK)
- `platform_fee_percent` (numeric)
- `expert_split_percent` (numeric)
- `team_split_percent` (numeric)
- `manual_daily_avg` (numeric, nullable)
- `manual_proj_days` (int, nullable)

## Security (RLS Policies)
- **Select/Insert/Update/Delete:** generally allowed if `auth.uid()` is in `tenant_members` for the requested `tenant_id`.
