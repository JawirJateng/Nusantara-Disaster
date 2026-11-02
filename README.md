# Nusantara Disaster Watch (NDW)

**National Multi-Hazard Geospatial Monitoring Platform**  
*One Map. All Disasters. Real-Time Awareness.*

## Overview
Nusantara Disaster Watch (NDW) is a national web-based disaster monitoring platform that consolidates publicly available disaster information across Indonesia into an interactive geospatial map and administrative dashboard.

## Tech Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Apache ECharts.
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL + PostGIS, Redis & BullMQ, Server-Sent Events (SSE).
- **Infrastructure**: Docker & Docker Compose.

## Getting Started with Docker
```bash
docker-compose up --build
```
- **Public Website & Map**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin (Default credentials: `admin@ndw.go.id` / `admin123`)
- **Backend API**: http://localhost:4000/api/v1
- **API Documentation**: http://localhost:4000/api/docs
