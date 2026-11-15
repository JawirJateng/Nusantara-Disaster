-- CreateEnum
CREATE TYPE "SyncHealth" AS ENUM ('IDLE', 'HEALTHY', 'RUNNING', 'DEGRADED', 'FAILED', 'DISABLED');

-- DropIndex
DROP INDEX "DisasterEvent_externalId_key";

-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "failureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "logRetentionDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "nextPollAt" TIMESTAMP(3),
ADD COLUMN     "supportsIncremental" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "syncLockExpiresAt" TIMESTAMP(3),
ADD COLUMN     "timeoutMs" INTEGER NOT NULL DEFAULT 10000;

-- AlterTable
ALTER TABLE "DisasterEvent" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "identityFingerprint" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SyncLog" ADD COLUMN     "errorCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eventsFetched" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eventsRejected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eventsReview" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eventsSkipped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eventsValid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "rateLimitCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "SyncCheckpoint" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "status" "SyncHealth" NOT NULL DEFAULT 'HEALTHY',
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "lastSeenUpdatedAt" TIMESTAMP(3),
    "cursor" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncCheckpoint_dataSourceId_key" ON "SyncCheckpoint"("dataSourceId");

-- CreateIndex
CREATE INDEX "DisasterEvent_sourceId_occurredAt_idx" ON "DisasterEvent"("sourceId", "occurredAt");

-- CreateIndex
CREATE INDEX "DisasterEvent_occurredAt_idx" ON "DisasterEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "DisasterEvent_lastSeenAt_idx" ON "DisasterEvent"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "DisasterEvent_sourceId_externalId_key" ON "DisasterEvent"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DisasterEvent_sourceId_identityFingerprint_key" ON "DisasterEvent"("sourceId", "identityFingerprint");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncLog_dataSourceId_createdAt_idx" ON "SyncLog"("dataSourceId", "createdAt");

-- AddForeignKey
ALTER TABLE "SyncCheckpoint" ADD CONSTRAINT "SyncCheckpoint_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill timestamps for rows that predate the IDSE columns (event content is not modified).
UPDATE "DisasterEvent" SET "firstSeenAt" = "createdAt" WHERE "firstSeenAt" > "createdAt";
UPDATE "DisasterEvent" SET "lastSeenAt" = "updatedAt" WHERE "lastSeenAt" > "updatedAt";
UPDATE "SyncLog"
SET "startedAt" = "createdAt" - ("durationMs" * INTERVAL '1 millisecond'),
    "finishedAt" = "createdAt"
WHERE "finishedAt" IS NULL;

