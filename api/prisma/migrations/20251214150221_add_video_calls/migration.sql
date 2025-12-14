-- CreateEnum
CREATE TYPE "VideoCallStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "video_calls" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "VideoCallStatus" NOT NULL DEFAULT 'WAITING',
    "initiatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_calls_roomName_key" ON "video_calls"("roomName");

-- CreateIndex
CREATE INDEX "video_calls_conversationId_idx" ON "video_calls"("conversationId");

-- CreateIndex
CREATE INDEX "video_calls_status_idx" ON "video_calls"("status");

-- AddForeignKey
ALTER TABLE "video_calls" ADD CONSTRAINT "video_calls_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
