# Implementation Plan: Nusantara Disaster Watch (NDW)

## 1. Executive Summary & Architecture

**Nusantara Disaster Watch (NDW)** is a national multi-hazard geospatial monitoring platform designed to consolidate disaster data across Indonesia into an interactive map and administrative dashboard.

### Architecture
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Apache ECharts.
- **Backend**: NestJS, TypeScript, Prisma ORM with PostgreSQL + PostGIS, Redis & BullMQ for background sync workers, Server-Sent Events (SSE) for real-time updates.
- **Database**: PostgreSQL with PostGIS extension for spatial queries.
- **Infrastructure**: Docker & Docker Compose for orchestration.

---

## 2. Database Schema (Prisma + PostGIS)

1. **`User`**: Admin users, operators, viewers. Fields: `id`, `email`, `passwordHash`, `name`, `role` (`SUPER_ADMIN`, `OPERATOR`, `VIEWER`), `isActive`, timestamps.
2. **`DisasterEvent`**: Core disaster records. Fields: `id`, `title`, `description`, `category` (`EARTHQUAKE`, `FLOOD`, `VOLCANO`, `LANDSLIDE`, `WEATHER`, `WILDFIRE`, `OTHER`), `severity` (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), `status` (`ACTIVE`, `CONTAINED`, `RESOLVED`, `ARCHIVED`), `verificationStatus` (`VERIFIED`, `UNVERIFIED`, `FALSE_ALARM`), `province`, `regency`, `locationName`, `latitude`, `longitude`, `geometry` (PostGIS geometry / GeoJSON), `occurredAt`, `sourceId`, `externalId`, `rawPayload`, `metadata` (JSON), timestamps.
3. **`DataSource`**: External connector configurations. Fields: `id`, `name`, `code` (`BMKG`, `BNPB`, `PVMBG`, `NASA_FIRMS`, `PETABENCANA`), `isEnabled`, `pollIntervalMinutes`, `lastSyncAt`, `lastSyncStatus` (`SUCCESS`, `FAILED`, `PARTIAL`), `lastErrorMessage`, credentials/config (JSON), timestamps.
4. **`SyncLog`**: Detailed sync logs. Fields: `id`, `dataSourceId`, `status`, `eventsProcessed`, `eventsCreated`, `eventsUpdated`, `errorMessage`, `durationMs`, timestamps.
5. **`NewsItem`**: Situation reports and disaster news. Fields: `id`, `title`, `summary`, `content`, `category`, `sourceName`, `sourceUrl`, `publishedAt`, timestamps.
6. **`AuditLog`**: System audit trail. Fields: `id`, `userId`, `action`, `entityType`, `entityId`, `details` (JSON), `ipAddress`, timestamps.

---

## 3. Backend Module Structure (NestJS)

- `prisma`: Database module & service.
- `auth`: JWT authentication, guards, roles decorator (`@Roles`).
- `events`: Disaster events CRUD, spatial filtering, public/admin endpoints.
- `sources`: Data source management, manual sync triggers.
- `connectors`: Integrations for BMKG, BNPB, PVMBG, NASA FIRMS, PetaBencana + robust mock/simulated fallback data generator for offline/resilient testing.
- `sync`: BullMQ background worker queue for automated data polling.
- `realtime`: SSE gateway (`/api/v1/realtime/stream`) pushing live event updates to connected clients.
- `news`: Disaster news and situation reports ingestion & API.
- `audit`: Audit logging interceptor and service.
- `analytics`: Aggregated statistics for charts (ECharts).

---

## 4. Frontend Structure (Next.js App Router)

### Public Pages (`/`)
- `layout.tsx`: Root layout with Header (navigation, live status badge, search, login button) and Footer.
- `page.tsx`: Map-first homepage.
  - Top national disaster summary banner (Active emergencies, earthquakes today, total affected).
  - Main Interactive Map (`MapLibreMap.tsx`) with category filters, time range filters, region filters, cluster markers, custom popups, and detail drawer (`EventDetailDrawer.tsx`).
  - Below map: Disaster News & Situation Reports feed (`NewsFeed.tsx`) and Recent Events table/cards.
- `/kejadian`: Full searchable, filterable disaster events table & grid with pagination and export.
- `/statistik`: Apache ECharts analytics dashboard (Disaster breakdown by category, severity distribution, regional hotspots, timeline trend).
- `/sumber`: Data source transparency page (list of connected official providers, sync freshness, status indicators).
- `/tentang`: About NDW, methodology, data attribution, and disclaimer.

### Admin Dashboard (`/admin`)
- `layout.tsx`: Protected admin layout with sidebar navigation, user profile, and logout.
- `page.tsx`: Admin overview (KPI cards, sync health, recent activity, queue status).
- `admin/kejadian`: Event management (search, filter, view raw payload, verify, publish/unpublish, add manual event, merge duplicates).
- `admin/sumber`: Data source connector management, manual sync trigger, status check.
- `admin/pengguna`: User management (invite, edit role, deactivate).
- `admin/audit`: Audit logs viewer.

---

## 5. Development & Deployment

- `docker-compose.yml`: Services for PostgreSQL + PostGIS, Redis, Backend (NestJS), Frontend (Next.js).
- Environment variable templates (`.env.example`).
