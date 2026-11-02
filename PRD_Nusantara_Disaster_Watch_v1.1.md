# Product Requirements Document (PRD)

# NUSANTARA DISASTER WATCH (NDW)

### National Multi-Hazard Geospatial Monitoring Platform

  -----------------------------------------------------------------------
  Metadata                            Detail
  ----------------------------------- -----------------------------------
  Product                             Nusantara Disaster Watch (NDW)

  Document                            Product Requirements Document

  Version                             1.1

  Status                              Draft for development — homepage and news requirements updated

  Platform                            Responsive web application

  Primary audience                    Indonesian public,
                                      disaster-monitoring operators,
                                      administrators

  Primary language                    Bahasa Indonesia

  Core capability                     Multi-source disaster monitoring
                                      with automatically updated
                                      geospatial map
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 1. Product Overview

Nusantara Disaster Watch (NDW) is a national web-based disaster
monitoring platform that consolidates publicly available disaster
information from trusted data providers into one interactive geospatial
interface.

The platform is designed to help the public understand reported disaster
events across Indonesia and help authorized operators manage, validate,
monitor, and publish information through an administrative dashboard.

The central experience is an interactive map of Indonesia. When a new
event is received from a connected source and contains usable geographic
information, the platform processes the record and displays the
corresponding marker or geographic feature on the map. Updates should be
delivered to connected browsers without requiring a page reload.

NDW is an information and situational-awareness platform. It is not an
emergency dispatch system, an official warning authority, or a
replacement for BMKG, BNPB, PVMBG, local governments, or emergency
services.

### 1.1 Product vision

Provide a clear, dependable, and accessible national view of reported
natural hazards in Indonesia through a unified map, transparent data
provenance, and reliable update workflows.

### 1.2 Product principles

1.  **Source transparency:** Every externally sourced record must
    identify its source and source timestamp.
2.  **Geospatial accuracy:** Coordinates and geometries must be
    validated before being mapped.
3.  **Freshness honesty:** Show when data was last updated; never imply
    stale data is live.
4.  **Separation of authority:** Preserve official warning wording and
    status from the issuing agency.
5.  **Public accessibility:** Public monitoring must work without an
    account.
6.  **Operational control:** Authorized administrators can manage
    platform content, integrations, and users.
7.  **Resilient operation:** A failed upstream source must not take down
    the whole platform.
8.  **Minimalist design:** Prioritize legibility, map usability,
    information hierarchy, and restrained visual styling over
    decoration.

------------------------------------------------------------------------

## 2. Goals and Success Metrics

### 2.1 Product goals

-   Present multiple natural-hazard categories in one national
    monitoring interface.
-   Automatically ingest and map records from supported external
    sources.
-   Provide live map updates when new or changed records are processed.
-   Allow users to filter events by hazard, time, location, and status.
-   Provide event details, data source, timestamps, and verification
    state.
-   Provide administrators with tools to manage records, data providers,
    synchronization, users, and audit history.
-   Provide historical and statistical views for situational awareness
    and geographic analysis.

### 2.2 Success metrics

Measure these metrics after a stable production baseline exists:

  -----------------------------------------------------------------------
  Metric                              Target
  ----------------------------------- -----------------------------------
  Public map initial usable render    p95 under 4 seconds on a typical
                                      broadband connection

  Processed event-to-map update       p95 under 60 seconds after
                                      successful source retrieval and
                                      processing, excluding upstream
                                      delays

  API availability                    99.5% monthly target for the
                                      application API

  Valid-coordinate mapping            At least 98% of mappable ingested
                                      records

  Duplicate event reduction           Duplicate records identified or
                                      linked rather than silently
                                      double-counted

  Source transparency                 100% of external event detail pages
                                      show source and source update time
                                      where provided

  Admin audit coverage                100% of privileged data and
                                      configuration changes logged
  -----------------------------------------------------------------------

Targets are engineering objectives, not guarantees about external
provider availability or disaster detection latency.

------------------------------------------------------------------------

## 3. Scope

### 3.1 MVP scope

The first release must include:

-   Responsive public dashboard.
-   Interactive map centered on Indonesia.
-   Disaster event list and event detail view.
-   Automatic marker/feature rendering from validated coordinates.
-   Initial integration with BMKG data sources that are publicly
    accessible and permitted for use.
-   Generic source connector architecture so other providers can be
    added without redesigning the application.
-   PostgreSQL with PostGIS.
-   Scheduled background ingestion, normalization, validation, and
    deduplication.
-   WebSocket or Server-Sent Events delivery for live updates.
-   Admin authentication and role-based access control.
-   Admin event management and source synchronization monitoring.
-   Data freshness and source status indicators.
-   Basic analytics and historical filters.
-   Audit logs.

### 3.2 Post-MVP scope

-   Additional BNPB, PVMBG/MAGMA, NASA FIRMS, and PetaBencana
    integrations, subject to their current API terms, access rules,
    licensing, and technical availability.
-   Community incident submissions with moderation and verification
    workflow.
-   Advanced heatmaps and time-series playback.
-   Population and administrative-area overlays.
-   Risk-map overlays from authorized datasets.
-   GIS export to GeoJSON and CSV; shapefile export where technically
    and legally appropriate.
-   More advanced analytics and regional reporting.
-   Push notifications and configurable alert subscriptions.

### 3.3 Out of scope

-   Replacing official government warning systems.
-   Automatically issuing official evacuation orders.
-   Guaranteeing detection of every disaster in real time.
-   Predicting exact disaster occurrence, location, or impact.
-   Dispatching emergency response teams.
-   Treating unverified community reports or satellite hotspots as
    confirmed disaster incidents.
-   Presenting AI-generated conclusions as official hazard assessments.

------------------------------------------------------------------------

## 4. User Roles and Permissions

Public visitors do not need to sign in to access public monitoring
information.

  Capability                                               Public   Data Operator     Admin   Super Admin
  ---------------------------------------- ---------------------- --------------- --------- -------------
  View public dashboard and map                               Yes             Yes       Yes           Yes
  Filter and search public events                             Yes             Yes       Yes           Yes
  View event source and history                               Yes             Yes       Yes           Yes
  Submit a community report                  Optional, if enabled             Yes       Yes           Yes
  Review and verify submitted reports                          No             Yes       Yes           Yes
  Create or edit manually managed events                       No         Limited       Yes           Yes
  Manage source connectors                                     No              No   Limited           Yes
  Trigger synchronization manually                             No              No       Yes           Yes
  Manage users and roles                                       No              No   Limited           Yes
  Change global configuration                                  No              No   Limited           Yes
  View audit logs                                              No         Limited       Yes           Yes
  Manage system-wide settings                                  No              No        No           Yes

### 4.1 Role definitions

**Public** - Anonymous visitor. - Can view published events, maps,
warnings, statistics, and source details. - Cannot access administrative
endpoints.

**Data Operator** - Reviews incoming reports and records assigned for
moderation. - Can add internal notes and propose corrections. - Cannot
change global source settings or assign privileged roles.

**Admin** - Manages event publication, manual records, source
monitoring, and permitted users. - Can initiate synchronization and
review operational logs. - Cannot grant Super Admin privileges.

**Super Admin** - Full platform configuration access. - Manages
administrator accounts, roles, source credentials, global settings, and
retention policies. - All sensitive actions must be audited.

All permissions must be enforced server-side, not only hidden in the
frontend.

------------------------------------------------------------------------

## 5. Disaster Categories and Data Model

The platform should support a configurable taxonomy rather than
hardcoding all categories into UI logic.

Initial categories:

  -----------------------------------------------------------------------
  Category                Example event data      Typical geometry
  ----------------------- ----------------------- -----------------------
  Earthquake              Magnitude, depth,       Point; optional impact
                          epicenter, occurrence   area
                          time                    

  Tsunami                 Warning level, affected Polygon or line; point
                          coastal area, update    for source event
                          status                  

  Flood                   Water level, affected   Point or polygon
                          locations, report time  

  Flash flood             Location, occurrence    Point or polygon
                          time, reported impact   

  Volcanic activity       Volcano, activity       Point, radius, or
                          status, ash column      polygon
                          where available         

  Landslide               Location, affected      Point or polygon
                          area, reported impacts  

  Forest and land fire    Hotspot, confidence,    Point or cluster
                          satellite observation   
                          time                    

  Extreme weather         Warning area, hazard    Polygon
                          type, validity period   

  Strong wind / tornado   Location, reported      Point or polygon
                          time, impact            

  Drought                 Affected region,        Polygon
                          indicator, observation  
                          period                  

  Coastal abrasion /      Coastal segment,        Line or polygon
  tidal flood             affected area,          
                          observation period      
  -----------------------------------------------------------------------

### 5.1 Important classification rules

-   A satellite hotspot is an observation or detection, not
    automatically a confirmed fire incident.
-   A weather warning polygon is an alert area, not necessarily a
    confirmed disaster event.
-   A volcano status is an ongoing condition and should not be
    duplicated as a new eruption event every time the status is
    refreshed.
-   A single disaster may contain multiple reports, observations, and
    geographic features.
-   Store source classifications and normalized platform classifications
    separately.

------------------------------------------------------------------------

## 6. Data Sources and Integration Strategy

Potential providers include:

  -----------------------------------------------------------------------
  Provider                Potential data          Integration notes
  ----------------------- ----------------------- -----------------------
  BMKG                    Earthquake, tsunami,    Use official public
                          weather warnings        data services and
                                                  follow current usage
                                                  guidance

  BNPB / InaRISK /        Disaster events,        Confirm available
  official disaster data  impacts, risk           endpoints, access
  services                information             conditions, and dataset
                                                  update frequency

  PVMBG / MAGMA Indonesia Volcano activity and    Confirm permitted
                          geological hazards      access and
                                                  source-specific update
                                                  semantics

  NASA FIRMS              Satellite fire          Use the relevant API,
                          detections / hotspots   attribution,
                                                  confidence, and
                                                  observation-time fields

  PetaBencana.id          Community and flood     Follow API
                          reports                 documentation,
                                                  attribution, and report
                                                  semantics
  -----------------------------------------------------------------------

Potential starting points: - BMKG data portal:
https://data.bmkg.go.id/ - BNPB data portal: https://data.bnpb.go.id/ -
MAGMA Indonesia: https://magma.esdm.go.id/ - NASA FIRMS:
https://firms.modaps.eosdis.nasa.gov/ - PetaBencana API documentation:
https://docs.petabencana.id/routes

These are candidate sources, not a guarantee that every desired dataset
has an unrestricted, stable, or real-time API. Before implementation,
verify current endpoint availability, authentication, quotas,
attribution requirements, licensing, and allowed caching or
redistribution.

### 6.1 Connector architecture

Each provider must be implemented as an independent connector with a
shared interface:

-   `fetch()`: retrieve source records.
-   `parse()`: parse provider-specific payload.
-   `normalize()`: map provider fields to the platform schema.
-   `validate()`: validate coordinates, timestamps, and required fields.
-   `deduplicate()`: identify matching source or cross-source records.
-   `persist()`: store raw and normalized records.
-   `reportHealth()`: publish connector health and sync results.

A provider failure must not block other connectors.

### 6.2 Data ingestion workflow

1.  A scheduled worker or webhook receives new source data.
2.  Preserve the raw source payload for traceability, subject to
    retention policy.
3.  Parse the payload and normalize its fields.
4.  Validate schema, coordinates, timestamps, and source identifiers.
5.  Determine whether the record is new, updated, duplicate, or invalid.
6.  Link records that appear to describe the same real-world event
    without destroying source-specific observations.
7.  Store normalized data and provenance.
8.  Publish an event to the real-time distribution layer.
9.  Update connector health and synchronization logs.
10. Surface invalid records for operator review when appropriate.

### 6.3 Synchronization behavior

-   Use provider-specific polling intervals based on documented update
    behavior and rate limits.
-   Support webhooks where officially available.
-   Use retries with exponential backoff and jitter.
-   Set request timeouts and circuit breakers.
-   Track last successful sync, last attempted sync, record counts, and
    errors.
-   Avoid excessive polling.
-   Allow administrators to trigger a manual sync with permission
    checks.
-   Do not expose provider secrets to the browser.

### 6.4 Data freshness

Every source and event should distinguish: - `occurred_at`: when the
event occurred, if known. - `observed_at`: when the provider observed
it, if supplied. - `source_updated_at`: when the source last updated the
record, if supplied. - `fetched_at`: when NDW retrieved it. -
`processed_at`: when NDW processed it. - `last_synced_at`: latest
successful connector synchronization.

Display the most relevant source timestamp and NDW retrieval time in the
UI. If a source is stale or unavailable, show a clear status such as
"Data terakhir diterima ..." rather than implying current live coverage.

### 6.5 Disaster news and situation-report sources

News and situation reports are a separate information stream from
structured disaster-event feeds. Use them to provide context beneath the
homepage map, not as the sole basis for creating confirmed disaster
records.

Candidate sources for the initial news connector set:

| Provider | Content | Integration approach | Important constraints |
|---|---|---|---|
| BNPB — Informasi Bencana | Official disaster bulletins and situation information | Official website feed/page connector where permitted; verify whether a documented API or RSS is available before implementation | Treat bulletins as official publications; do not assume an undocumented API exists |
| ANTARA News | National news and press releases | RSS feed ingestion | Filter for disaster-related Indonesian coverage; retain article URL, publisher, title, and publication date |
| ReliefWeb / OCHA | Humanitarian situation reports, assessments, and response updates | REST API, JSON | Requires an approved `appname`; respect original report rights and attribution |
| GDELT DOC API | Search and discovery of news articles across publishers and languages | REST API returning article-list data in supported formats | Aggregator, not an official verification source; relevance and location must be checked |
| BMKG | Earthquake information and official weather early warnings | Existing BMKG data/CAP connectors | Use as official hazard information and alerts, not as general media news |

Reference links:
- BNPB Informasi Bencana: https://bnpb.go.id/informasi-bencana
- ANTARA RSS: https://en.antaranews.com/rss
- ReliefWeb API documentation: https://apidoc.reliefweb.int/
- GDELT DOC API documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- BMKG Open Data: https://data.bmkg.go.id/

The listed sources have different technical capabilities. Do not claim
that every source provides a public REST API or real-time feed. Verify
the current feed URL, API access, authentication, rate limits, update
frequency, licensing, attribution, and reuse rights before enabling a
connector in production.

#### News ingestion and publication workflow

1. Fetch permitted RSS/API records on a source-specific schedule.
2. Normalize title, summary, canonical URL, publisher, language,
   published time, fetched time, and available media metadata.
3. Filter for Indonesian disaster relevance using categories and
   keywords; use geographic and event matching as supporting signals.
4. Deduplicate by canonical URL and normalized title/publisher.
5. Link an article to an NDW event only when location, hazard type, and
   timing provide a defensible match. Keep unmatched articles separate.
6. Apply source attribution and reuse rules before public display.
7. Publish only records that pass validation and moderation rules.
8. Keep original article links available; do not mirror full article
   bodies or bypass publisher access controls.

News records must have a content class such as `official_bulletin`,
`media_article`, `humanitarian_report`, or `community_update`.
The UI must label the class clearly. A media article or community update
must never be presented as an official government warning.

Suggested `disaster_news` fields:
- `id`
- `provider_id`
- `external_id` nullable
- `title`
- `summary`
- `canonical_url`
- `publisher_name`
- `content_class`
- `language`
- `published_at`
- `fetched_at`
- `image_url` nullable, only when reuse/display is permitted
- `related_disaster_id` nullable
- `relevance_status`
- `publication_status`
- `created_at`
- `updated_at`

Suggested public endpoint:
- `GET /api/v1/news?category=&province=&from=&to=&page=`

------------------------------------------------------------------------

## 7. Geospatial Map Requirements

The map is the primary product surface.

### 7.1 Map engine

Use MapLibre GL JS with a documented and appropriately licensed basemap
provider. Keep map styling and source configuration replaceable. Do not
hardcode a commercial tile URL without checking its terms and usage
limits.

### 7.2 Core map features

-   Default national extent covering Indonesia.
-   Pan and zoom.
-   Automatic marker or geometry rendering from validated coordinates.
-   Marker clustering at low zoom levels.
-   Cluster expansion on click.
-   Distinct symbology for each disaster category.
-   Layer visibility controls.
-   Event-type filters.
-   Date/time filters.
-   Province and district search.
-   Popup or side panel on feature selection.
-   Map legend.
-   Reset-to-national-extent control.
-   Loading, empty, offline, and error states.
-   Responsive behavior on mobile and tablet.
-   Accessible controls and keyboard focus states.

### 7.3 Geometry support

Support: - Point for epicenters, observation locations, and individual
reports. - LineString for affected routes or coastal segments where
provided. - Polygon and MultiPolygon for warning areas, affected areas,
or administrative overlays. - GeometryCollection only where a source
requires it and the application can safely render it.

Do not fabricate an affected polygon from a point. If the source only
provides a point, display a point and label the geometry type
accurately.

### 7.4 Map layers

Initial layers: 1. Disaster events. 2. Official warning areas, when
available. 3. Satellite hotspot observations. 4. Administrative
boundaries. 5. Optional population or exposure overlay in a later phase.
6. Optional hazard-risk overlays from approved datasets.

### 7.5 Map filters

-   Disaster category.
-   Date range: last 24 hours, 7 days, 30 days, custom range.
-   Province and district.
-   Source provider.
-   Verification status.
-   Event status.
-   Severity or warning level, only where provided by the source or
    defined transparently by the platform.

### 7.6 Map performance

-   Use clustering and vector tiles or server-side spatial queries for
    large datasets.
-   Request only features within the current map bounds and zoom level
    where appropriate.
-   Use pagination or bounded time windows for event lists.
-   Avoid sending all historical records to the browser.
-   Debounce map-bound queries.
-   Cache suitable public read queries.
-   Keep map interaction responsive while data refreshes.

### 7.7 Automatic marker behavior

When a valid new event arrives: 1. Backend persists the event. 2.
Backend emits a typed update event. 3. Frontend receives the event. 4.
Frontend checks active filters and map bounds. 5. The marker or geometry
is added or updated. 6. The event list and summary counters update. 7.
If the event is outside the current filter or map bounds, do not force
the map to jump; show a subtle new-event indicator.

The map must not automatically zoom to every incoming event because that
would disrupt the user's current exploration.

------------------------------------------------------------------------

## 8. Public Website Requirements

### 8.1 Public homepage — Map-First Disaster Monitoring

The homepage is the primary public monitoring experience. It must open
directly to the disaster monitoring interface, not to a marketing-style
landing page, welcome screen, or login page.

**Core requirement:** the first meaningful content visible to a visitor
must be the interactive map of Indonesia and a concise overview of
current disaster activity. A disaster news and situation-report feed
must appear directly below the map.

Public access is anonymous by default. Visitors must not be required to
register, sign in, or provide personal information to view the map,
event details, statistics, or public disaster news.

#### Homepage content order

1. **Compact header / navigation**
   - NDW brand and product name.
   - Navigation to Peta Bencana, Daftar Kejadian, Statistik, Sumber Data,
     and Tentang.
   - A discreet Admin Login link, separated from public navigation.
   - No oversized hero banner or promotional content that pushes the
     map below the fold.

2. **National situation summary**
   - Compact statistic cards for current events by hazard category,
     active official warnings, and recently updated records.
   - Counts must be calculated from published records and clearly
     defined time windows.
   - Never hardcode sample counts or show fabricated live metrics.
   - Distinguish confirmed incidents, observations, community reports,
     and official warnings.

3. **Primary interactive disaster map**
   - The map is the dominant visual component of the homepage.
   - Default extent covers the Indonesian archipelago.
   - Render validated event points and supplied line/polygon geometries.
   - Include category, date/time, province/district, source, and
     verification/status filters.
   - Include layer controls, legend, search, map reset, clustering,
     feature selection, and event detail popup or side drawer.
   - Show data freshness and source status.
   - On mobile, expose filters through a bottom sheet or compact drawer.
   - Do not automatically pan or zoom to every newly received event.
   - Provide an accessible list alternative for map events.

4. **Disaster news and situation reports — immediately below the map**
   - Display a chronological feed of relevant disaster news, official
     situation updates, and humanitarian reports associated with events
     shown on the map where a reliable relationship can be established.
   - Each card should show headline, short summary, thumbnail where
     legally permitted, hazard category, affected location, publication
     time, publisher/source, and link to the original report.
   - Clearly distinguish official agency releases, media articles,
     humanitarian situation reports, community submissions, and NDW
     editorial summaries.
   - Preserve the original publisher and publication timestamp.
   - Do not scrape or republish full copyrighted articles. Use permitted
     API fields, short summaries, attribution, and outbound links.
   - Do not generate fictional headlines, article images, locations, or
     publication dates.
   - If no current news is available, show an honest empty state instead
     of placeholder articles.

5. **Latest disaster events**
   - Show recently received or updated records with category, location,
     occurrence time, source, and verification state.
   - Selecting an item focuses the corresponding map feature without
     interrupting map navigation.

6. **Data source and platform status**
   - Show last successful synchronization and freshness for relevant
     providers.
   - Indicate partial outages and stale sources honestly.
   - Link to methodology, source attribution, and data limitations.

#### Homepage behavior and data rules

- Map, event list, and summary counts must use consistent public query
  and filter semantics.
- News ingestion is a separate connector domain from disaster event
  ingestion. A news article is not proof that a disaster occurred.
- Store article source URL, publisher, title, summary, publication
  timestamp, fetched timestamp, category, language, and optional
  relationship to one or more disaster records.
- Preserve original links and publisher attribution.
- Apply deduplication to syndicated or repeated articles.
- News search results must be filtered for Indonesia and disaster
  relevance before publication.
- Articles from media outlets are contextual reporting, not official
  warnings or verified incident records.

### 8.2 Disaster map page

-   Large map canvas.
-   Filter panel.
-   Event list panel.
-   Event detail drawer or panel.
-   Layer control.
-   Search by location.
-   Legend and data freshness indicator.

### 8.3 Event detail page

Show: - Event title and category. - Location and administrative area. -
Occurrence time. - Coordinates or geometry description. - Source name
and source record identifier where available. - Magnitude, depth, water
level, volcano status, hotspot confidence, or other category-specific
fields where available. - Impact data only when supported by a cited
source. - Verification and publication status. - Source update and
platform retrieval timestamps. - Related updates or event history. -
Clear link to the originating source when available.

Do not display empty fields or invent missing values.

### 8.4 Statistics and analysis page

-   Events by category.
-   Events by province and district.
-   Time-series charts.
-   Source distribution.
-   Historical comparison.
-   Optional spatial density visualization.
-   Export of filtered public datasets, subject to source licensing.

Every chart must show the selected time range, filters, unit, and data
coverage.

### 8.5 About and methodology page

Explain: - What NDW does and does not do. - Data providers and
attribution. - How records are normalized and deduplicated. - Difference
between warning, observation, report, and confirmed incident. - Update
frequency and data limitations. - Emergency guidance directing users to
official agencies and local authorities.

------------------------------------------------------------------------

## 9. Admin Dashboard Requirements

### 9.1 Admin overview

Display: - Total records by category. - Newly received records. -
Records requiring review. - Active warnings. - Connector health. - Last
successful sync per provider. - Recent admin activity. - Queue and
processing failures.

### 9.2 Event management

Authorized administrators can: - Search and filter records. - View raw
source payload where permitted. - View normalized fields and geometry. -
Add manually managed records. - Edit platform-managed metadata. -
Publish, unpublish, archive, or flag records. - Link duplicate or
related records. - Add internal notes. - View change history.

Source-originated facts should remain traceable. If an operator corrects
a platform field, record the correction and preserve the original source
value. Do not silently overwrite official source data.

### 9.3 Source management

-   List configured providers.
-   Enable or disable a connector.
-   Configure safe polling intervals.
-   View last attempt and last success.
-   View request, parsing, and validation errors.
-   Trigger manual sync.
-   View rate-limit and quota state where available.
-   Manage credentials securely.
-   Test connector configuration without exposing secrets.

### 9.4 User management

-   Create, invite, suspend, and deactivate users.
-   Assign roles.
-   Revoke sessions.
-   Enforce strong authentication for privileged roles.
-   Record role and account changes in audit logs.

### 9.5 Map configuration

-   Manage category colors and symbols.
-   Enable or disable layers.
-   Configure default map extent.
-   Configure permitted basemap sources.
-   Manage administrative boundary datasets.
-   Configure clustering thresholds where appropriate.

### 9.6 Content management

-   Manage homepage announcements.
-   Manage public information pages.
-   Manage methodology and source descriptions.
-   Manage emergency disclaimer content.
-   Manage SEO metadata.

### 9.7 Audit logs

Record: - Actor and role. - Action. - Target entity. - Timestamp. -
Before and after values for relevant changes. - Request or correlation
ID. - IP/device metadata where legally and operationally appropriate.

Audit logs must be append-only for normal application roles. Super Admin
access to audit data must also be logged.

------------------------------------------------------------------------

## 10. Community Reporting (Post-MVP)

If community reporting is enabled, it must be treated as a separate data
class from official provider records.

Submission fields: - Hazard category. - Description. - Location or map
pin. - Observation time. - Optional photo or attachment. - Optional
contact information, with clear privacy notice.

Workflow: 1. User submits a report. 2. Server validates input and
applies rate limits and abuse controls. 3. Report enters a pending
queue. 4. Operator reviews location, content, and possible duplicates.
5. Operator marks it as unverified, verified by platform review,
rejected, or linked to an existing event. 6. Public display clearly
identifies community-reported information.

"Verified by platform review" must not be represented as official
government confirmation.

------------------------------------------------------------------------

## 11. Notifications

Post-MVP notification channels: - In-app notification. - Browser push,
subject to user permission. - Optional email subscription.

Users may subscribe to: - Selected provinces or districts. - Selected
disaster categories. - Official warning updates.

Notifications must: - Include source and timestamp. - Link to the
relevant event or official source. - Avoid duplicate notifications for
unchanged records. - Respect user preferences and rate limits. - Never
present an unverified report as an official warning.

------------------------------------------------------------------------

## 12. Suggested Technical Architecture

### 12.1 Technology stack

  -----------------------------------------------------------------------
  Layer                               Recommended technology
  ----------------------------------- -----------------------------------
  Frontend                            Next.js, React, TypeScript

  Styling                             Tailwind CSS

  UI components                       shadcn/ui, with restrained
                                      customization

  Map                                 MapLibre GL JS

  Charts                              Apache ECharts

  Backend                             NestJS, TypeScript

  API                                 REST, documented with OpenAPI

  Live updates                        WebSocket or Server-Sent Events

  Database                            PostgreSQL

  Spatial extension                   PostGIS

  Cache and queue                     Redis

  Background jobs                     BullMQ

  Authentication                      Secure server-side session or
                                      vetted authentication solution

  Object storage                      S3-compatible storage

  Deployment                          Docker

  Reverse proxy                       Nginx or managed ingress

  Observability                       Structured logs, metrics, error
                                      tracking, health checks
  -----------------------------------------------------------------------

Use current stable releases at implementation time. Pin dependencies,
commit lockfiles, and avoid adopting a package solely because it is
labeled "latest."

### 12.2 Logical architecture

``` text
Public Browser / Admin Browser
            |
       Next.js Frontend
            |
       NestJS Backend
       /      |       \
   REST API  Realtime  Auth/RBAC
       |      Gateway
       |
  Application Services
       |
  PostgreSQL + PostGIS
       |
  Redis + BullMQ
       |
  Ingestion Workers
       |
  Provider Connectors
       |
 BMKG / BNPB / PVMBG / NASA FIRMS /
       PetaBencana / Other Sources
```

### 12.3 Service boundaries

Suggested backend modules: - `auth` - `users` - `roles` - `disasters` -
`disaster-types` - `geospatial` - `sources` - `ingestion` -
`normalization` - `deduplication` - `alerts` - `reports` - `analytics` -
`media` - `audit` - `realtime` - `health`

Keep provider-specific parsing inside connector modules. Domain services
must not depend on provider-specific payload formats.

------------------------------------------------------------------------

## 13. Database Design

Use UUID primary keys for internal entities. Store timestamps in UTC and
convert to the user's display timezone (default `Asia/Jakarta`) in the
frontend. Store geometries using an appropriate SRID, normally WGS 84 /
EPSG:4326 for source geographic coordinates.

### 13.1 Core tables

**users** - `id` - `name` - `email` - `password_hash` or external
identity reference - `role_id` - `is_active` - `created_at` -
`updated_at` - `last_login_at`

**roles** - `id` - `name` - `permissions` - `created_at`

**disaster_types** - `id` - `slug` - `name` - `description` - `icon` -
`color` - `is_active`

**disasters** - `id` - `canonical_reference` - `disaster_type_id` -
`title` - `description` - `occurred_at` - `status` -
`verification_status` - `publication_status` - `severity_value`
nullable - `severity_label` nullable - `created_at` - `updated_at`

**disaster_geometries** - `id` - `disaster_id` - `geometry` (PostGIS
geometry) - `geometry_type` - `purpose` (epicenter, observation,
warning_area, impact_area, report_location, etc.) - `source_record_id`
nullable - `created_at`

**data_sources** - `id` - `name` - `provider_code` - `base_url` -
`connector_type` - `is_enabled` - `poll_interval_seconds` -
`last_attempt_at` - `last_success_at` - `health_status` -
`configuration` (non-secret settings only)

**source_records** - `id` - `data_source_id` - `external_id` -
`raw_payload` (JSONB, subject to retention policy) -
`normalized_payload` (JSONB) - `source_occurred_at` -
`source_updated_at` - `fetched_at` - `processed_at` -
`processing_status` - `validation_errors`

**disaster_source_links** - `id` - `disaster_id` - `source_record_id` -
`relationship_type` - `confidence` - `created_at`

**disaster_impacts** - `id` - `disaster_id` - `impact_type` - `value` -
`unit` - `description` - `source_record_id` - `updated_at`

**disaster_alerts** - `id` - `disaster_id` - `source_record_id` -
`alert_level` - `message` - `valid_from` - `valid_until` - `status` -
`created_at`

**administrative_areas** - `id` - `parent_id` - `level` - `code` -
`name` - `boundary` (PostGIS geometry)

**api_sync_logs** - `id` - `data_source_id` - `started_at` -
`finished_at` - `status` - `records_fetched` - `records_created` -
`records_updated` - `records_rejected` - `error_summary` -
`correlation_id`

**audit_logs** - `id` - `actor_user_id` - `action` - `entity_type` -
`entity_id` - `before_data` - `after_data` - `created_at` -
`correlation_id`

**community_reports** (post-MVP) - `id` - `reporter_reference`
nullable - `disaster_type_id` - `description` - `observed_at` -
`geometry` - `moderation_status` - `reviewed_by` - `reviewed_at` -
`created_at`

### 13.2 Database requirements

-   Add spatial indexes (GiST) to geometry columns.
-   Add indexes for `occurred_at`, `status`, `disaster_type_id`,
    `publication_status`, and provider identifiers.
-   Enforce uniqueness for `(data_source_id, external_id)` when external
    IDs are stable.
-   Use database transactions for multi-record updates.
-   Define retention policies for raw payloads and logs.
-   Avoid storing unnecessary personal data.
-   Use migrations for all schema changes.
-   Use `JSONB` for source-specific attributes, not as a substitute for
    core relational fields.

------------------------------------------------------------------------

## 14. API Requirements

Expose a versioned REST API under `/api/v1`.

Example public endpoints:

``` text
GET    /api/v1/disasters
GET    /api/v1/disasters/:id
GET    /api/v1/disasters/:id/history
GET    /api/v1/disaster-types
GET    /api/v1/map/features
GET    /api/v1/statistics/overview
GET    /api/v1/statistics/by-type
GET    /api/v1/statistics/by-region
GET    /api/v1/sources/status
GET    /api/v1/news
GET    /api/v1/news/:id
```

Example admin endpoints:

``` text
POST   /api/v1/admin/disasters
PATCH  /api/v1/admin/disasters/:id
POST   /api/v1/admin/disasters/:id/publish
POST   /api/v1/admin/disasters/:id/archive
GET    /api/v1/admin/sources
PATCH  /api/v1/admin/sources/:id
POST   /api/v1/admin/sources/:id/sync
GET    /api/v1/admin/sync-logs
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/:id
GET    /api/v1/admin/audit-logs
```

### 14.1 API conventions

-   Validate all query parameters and request bodies.
-   Use pagination for lists.
-   Support bounding-box and time-range filters for map queries.
-   Return consistent error objects.
-   Use appropriate HTTP status codes.
-   Add rate limits to public endpoints.
-   Enforce role permissions on every admin endpoint.
-   Document request and response schemas using OpenAPI.
-   Avoid exposing raw credentials or sensitive internal payloads.

Example map request:

``` text
GET /api/v1/map/features
  ?bbox=105,-11,141,6
  &from=2026-10-25T00:00:00Z
  &to=2026-11-01T23:59:59Z
  &types=earthquake,flood
```

The exact response should be valid GeoJSON FeatureCollection, with only
safe properties intended for public use.

### 14.2 Realtime event contract

Example event:

``` json
{
  "event": "disaster.created",
  "eventId": "evt_123",
  "occurredAt": "2026-11-01T06:40:00Z",
  "data": {
    "disasterId": "uuid",
    "type": "earthquake",
    "title": "Gempa bumi",
    "geometry": {
      "type": "Point",
      "coordinates": [110.3, -8.2]
    },
    "source": "BMKG",
    "verificationStatus": "verified"
  }
}
```

The frontend must handle: - `disaster.created` - `disaster.updated` -
`disaster.archived` - `alert.created` - `source.status_changed`

Clients must reconnect safely and refresh relevant data after
reconnecting so missed events do not create permanent inconsistencies.

------------------------------------------------------------------------

## 15. UI/UX and Visual Direction

### 15.1 Design direction

Use a modern, minimalist, professional geospatial operations interface.

Visual qualities: - Dark-first interface with a carefully designed light
option if time permits. - Neutral surfaces and restrained accent
colors. - Clear typography and consistent spacing. - Dense information
only where it improves monitoring. - Strong contrast for map labels and
critical statuses. - Consistent iconography. - Subtle transitions only
when they improve orientation or feedback. - Responsive layout, with
mobile-first consideration for the public map.

Avoid: - Excessive gradients and glowing borders. - Unnecessary
glassmorphism. - Random decorative charts. - Oversized hero sections
that push the map below the fold. - Excessive animation. - Generic
AI-generated dashboard patterns. - Fake metrics, fake live status, or
placeholder incidents presented as real data.

### 15.2 Suggested navigation

Public: - Overview - Peta Bencana - Daftar Kejadian - Statistik - Sumber
Data - Tentang

Admin: - Overview - Disaster Management - Reports / Moderation - Data
Sources - Synchronization Logs - Map Configuration - User Management -
Content Management - Audit Logs - Settings

### 15.3 Responsive behavior

Desktop: - Map is the dominant canvas. - Filters and event list appear
in side panels. - Detail view opens without hiding essential map
context.

Tablet: - Side panels become collapsible. - Map remains usable in
landscape and portrait.

Mobile: - Map occupies most of the viewport. - Filters open in a bottom
sheet or drawer. - Event list opens as a separate panel. - Essential
source and freshness information remains visible. - Controls must have
touch-friendly sizes.

### 15.4 Accessibility

-   Meet WCAG 2.2 AA where practical.
-   Do not communicate hazard category by color alone.
-   Provide text labels and icons.
-   Ensure keyboard navigation and visible focus.
-   Provide accessible names for map controls.
-   Respect reduced-motion preferences.
-   Ensure chart data has a textual or tabular alternative.

------------------------------------------------------------------------

## 16. Security, Privacy, and Reliability

### 16.1 Security

-   Hash passwords using Argon2id or a vetted authentication provider.
-   Use secure, HttpOnly, SameSite cookies for browser sessions.
-   Apply CSRF protection where applicable.
-   Validate and sanitize all user input.
-   Use parameterized database queries.
-   Apply rate limits and abuse protection.
-   Enforce RBAC on the backend.
-   Store secrets in environment-specific secret management.
-   Never ship provider API keys in client-side code.
-   Use HTTPS in production.
-   Apply secure headers and a Content Security Policy.
-   Restrict file upload types and sizes; scan uploads where feasible.
-   Log privileged actions.
-   Provide session revocation and account deactivation.

### 16.2 Privacy

-   Public browsing must not require personal information.
-   Collect the minimum personal data needed for optional community
    reports.
-   Publish a privacy notice and retention policy.
-   Restrict access to reporter contact details.
-   Do not expose private report metadata publicly.
-   Follow applicable Indonesian data protection requirements.

### 16.3 Reliability

-   Isolate each data connector.
-   Use retries with backoff and circuit breakers.
-   Maintain a queue for recoverable processing failures.
-   Provide health and readiness endpoints.
-   Back up database and test restoration.
-   Monitor queue depth, API latency, errors, and connector freshness.
-   Keep last-known-good public data available when a source is
    temporarily unavailable.
-   Label stale information clearly.
-   Do not allow one provider outage to break the map or other provider
    integrations.

------------------------------------------------------------------------

## 17. Non-Functional Requirements

  -----------------------------------------------------------------------
  Area                                Requirement
  ----------------------------------- -----------------------------------
  Performance                         Public pages should be optimized
                                      for fast initial rendering

  Scalability                         Support growth in event records and
                                      concurrent map users

  Availability                        Target 99.5% monthly application
                                      API availability

  Maintainability                     Modular backend and independent
                                      provider connectors

  Security                            Server-side authorization and
                                      secure secret handling

  Data integrity                      Validate geometry, timestamps,
                                      source IDs, and required fields

  Observability                       Structured logs, metrics,
                                      tracing/correlation IDs, and health
                                      checks

  Accessibility                       Keyboard support, readable
                                      contrast, and non-color status cues

  Compatibility                       Current major desktop and mobile
                                      browsers

  Localization                        Indonesian by default; architecture
                                      should permit English later

  Time handling                       Store UTC; display Asia/Jakarta by
                                      default and identify timezone

  GIS                                 Support point, line, polygon,
                                      GeoJSON, and spatial querying

  Recovery                            Automated backups and documented
                                      restore procedure
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 18. Error and Empty States

Design explicit states for: - No events match the selected filters. -
Map data is loading. - Map tiles cannot be reached. - Realtime
connection is disconnected. - A data provider has not synchronized
recently. - A provider API is unavailable. - A source record has invalid
or missing coordinates. - A record is awaiting moderation. - A user
lacks permission. - An upload failed validation.

Use clear, calm language. Never disguise an error as an empty dataset or
show a green "live" indicator when the realtime connection is
disconnected.

------------------------------------------------------------------------

## 19. Testing and Quality Assurance

### 19.1 Unit tests

-   Provider parsers and normalizers.
-   Coordinate and geometry validation.
-   Deduplication rules.
-   Permission checks.
-   Statistics calculations.
-   Timestamp and timezone conversion.

### 19.2 Integration tests

-   Provider connector to database.
-   Queue retry and failure handling.
-   REST API to PostGIS queries.
-   Realtime event delivery.
-   Authentication and authorization.
-   Admin event publication workflow.

### 19.3 End-to-end tests

-   Public visitor opens dashboard and filters events.
-   Visitor selects a marker and views event details.
-   New test event is ingested and appears on the map.
-   Admin signs in and edits a platform-managed field.
-   Admin triggers a provider sync.
-   Unauthorized user is blocked from admin routes.
-   Provider outage displays stale-data status without crashing the
    application.

### 19.4 GIS tests

-   Validate coordinate order (longitude, latitude in GeoJSON).
-   Reject invalid latitude/longitude ranges.
-   Test points near Indonesia's geographic bounds.
-   Test MultiPolygon and GeometryCollection handling if supported.
-   Verify bounding-box filtering.
-   Verify spatial indexes are used for expected queries.
-   Verify clustering does not alter stored event coordinates.

### 19.5 Operational tests

-   Load test map endpoints and event lists.
-   Simulate provider timeouts and rate limits.
-   Simulate Redis or worker downtime.
-   Test database backup restoration.
-   Test reconnect behavior for realtime clients.
-   Review logs for accidental credential or personal-data exposure.

------------------------------------------------------------------------

## 20. Development Roadmap

### Phase 1 --- Foundation

Deliverables: - Monorepo or clearly separated frontend/backend
applications. - Development and production configuration. - Database and
PostGIS setup. - Authentication and role model. - Disaster taxonomy and
core schema. - Basic public dashboard shell. - Basic admin shell.

### Phase 2 --- Map and first provider

Deliverables: - Indonesia map. - MapLibre integration. - Event API and
GeoJSON endpoint. - BMKG connector for selected accessible datasets. -
Normalization and validation. - Automatic marker rendering. - Event
detail panel. - Source and freshness labels.

### Phase 3 --- Live updates and administration

Deliverables: - Background worker and queue. - Realtime event gateway. -
Admin event management. - Source connector management. - Sync logs and
health status. - Audit logs. - Error and stale-data states.

### Phase 4 --- Multi-source expansion

Deliverables: - Additional provider connectors after access and terms
review. - Cross-source linking and deduplication. - Category-specific
data fields. - Additional map layers. - Advanced filters.

### Phase 5 --- Analytics and hardening

Deliverables: - Historical analytics. - Regional summaries. - Export
functions. - Performance and security review. - Backup and recovery
procedures. - Production deployment and operational documentation.

------------------------------------------------------------------------

## 21. MVP Acceptance Criteria

The MVP is accepted when all of the following are true:

1.  A visitor can open the public dashboard without signing in.
2.  The map displays Indonesia and supports pan and zoom.
3.  A valid event with coordinates is automatically rendered at the
    correct geographic location.
4.  The application can ingest at least one approved external data
    source.
5.  The connector records its last attempt, last success, and processing
    outcome.
6.  New or updated events can reach connected clients without a full
    page reload.
7.  The event list and map filters work together consistently.
8.  Selecting a marker displays its details, source, and relevant
    timestamps.
9.  Invalid coordinates are rejected or quarantined rather than plotted
    incorrectly.
10. Duplicate source records are not silently counted as separate
    events.
11. A source outage is visible to users and administrators.
12. Public pages distinguish source data from manually managed platform
    information.
13. Admin routes require authentication and server-side permission
    checks.
14. Admin changes to records and configuration are recorded in audit
    logs.
15. The interface is responsive on desktop, tablet, and mobile.
16. No simulated or seed data is presented as a real current disaster.
17. The website clearly states that official emergency warnings must be
    confirmed through the responsible authorities.

------------------------------------------------------------------------

## 22. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Provider has no public API for a    Use only permitted sources; provide
  desired dataset                     manual import or defer the
                                      integration

  Provider changes its response       Versioned parsers, contract tests,
  format                              connector health alerts

  Provider outage or delayed update   Last-known-good data and clear
                                      freshness status

  Duplicate event reports             Stable external IDs, matching
                                      rules, human review for ambiguous
                                      cases

  Incorrect coordinates               Schema validation, geographic
                                      bounds, operator review

  High map data volume                Clustering, spatial indexes,
                                      viewport queries, vector tiles
                                      where needed

  Misinterpretation of warnings       Preserve official wording, source,
                                      validity period, and issuing
                                      authority

  Community misinformation            Moderation, rate limits, source
                                      labels, and clear unverified status

  Unauthorized admin changes          RBAC, MFA for privileged accounts,
                                      audit logs

  Map tile licensing or quota issues  Review provider terms and use
                                      replaceable basemap configuration
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 23. Implementation Guidance for the AI Coding Agent

Build the application as a production-minded, maintainable software
project. Do not generate a static dashboard mockup and claim it is
functional.

### Required implementation behavior

1.  Inspect the repository before changing files.
2.  Create or update an implementation plan and keep it aligned with
    this PRD.
3.  Use strict TypeScript and consistent linting/formatting.
4.  Use database migrations and seed only clearly labeled development
    fixtures.
5.  Build reusable components and modular provider connectors.
6.  Implement actual persistence, API validation, authentication, and
    authorization.
7.  Implement a real map data pipeline from the backend to the map.
8.  Keep all API secrets server-side.
9.  Add tests for critical data and permission workflows.
10. Document environment variables and local setup.
11. Provide Docker-based local development where practical.
12. Report incomplete integrations honestly; never fabricate live data.

### Suggested repository structure

``` text
nusantara-disaster-watch/
├── apps/
│   ├── web/                    # Next.js public and admin frontend
│   └── api/                    # NestJS backend
├── packages/
│   ├── shared/                 # Shared types and schemas
│   ├── ui/                     # Shared UI components, if needed
│   └── config/                 # Shared lint and TypeScript config
├── workers/
│   └── ingestion/              # Background ingestion workers
├── infrastructure/
│   ├── docker/
│   └── nginx/
├── docs/
│   ├── architecture.md
│   ├── data-sources.md
│   ├── api.md
│   └── operations.md
├── .env.example
├── docker-compose.yml
├── README.md
└── PRD.md
```

The exact structure may be adapted if the repository already has an
established architecture. Avoid unnecessary complexity or premature
microservices.

### Required documentation

-   Local development setup.
-   Environment variable reference.
-   Database migration and seed instructions.
-   Provider integration status and limitations.
-   API documentation.
-   Admin role and permission guide.
-   Deployment instructions.
-   Backup and recovery instructions.

------------------------------------------------------------------------

## 24. Final Product Definition

Nusantara Disaster Watch is a public-facing, multi-source, geospatial
disaster monitoring platform for Indonesia. Its defining feature is a
continuously updated national map that automatically plots validated
disaster records and geographic warning or observation features as they
become available from connected sources.

The platform must prioritize accurate location data, transparent source
attribution, honest freshness indicators, reliable ingestion, and a
clear distinction between official warnings, observations, community
reports, and confirmed incidents.

**Product tagline:**\
*One Map. All Disasters. Real-Time Awareness.*

**Primary product outcome:**\
A visitor can open the website, see the latest available disaster
information across Indonesia on an interactive map, filter events,
inspect their details and sources, while authorized administrators can
operate and maintain the platform through a secure dashboard.


------------------------------------------------------------------------

## 20. Homepage and News Implementation Acceptance Criteria

The public homepage is accepted only when all of the following are true:

- Opening the root URL displays the public monitoring experience
  directly; no login is required.
- The Indonesia disaster map is the primary and most prominent homepage
  component.
- Current event summaries are derived from stored, published records
  and display their time window and data freshness.
- Disaster news and situation reports appear immediately below the map.
- Every news card displays its publisher, publication time, and original
  source link.
- Official bulletins, media articles, humanitarian reports, and
  community updates are visually distinguishable.
- News articles are not automatically converted into confirmed
  disaster events.
- The page displays useful loading, empty, stale-data, and source-error
  states without fabricating incidents or articles.
- Public map, news, and event endpoints work without authentication.
- Admin routes and all write operations remain protected by
  server-side authentication and role-based authorization.
- The homepage is responsive and usable on desktop, tablet, and mobile.
