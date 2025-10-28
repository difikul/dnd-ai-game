-- CreateTable
CREATE TABLE "GeminiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,

    CONSTRAINT "GeminiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeminiUsage_userId_timestamp_idx" ON "GeminiUsage"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "GeminiUsage_timestamp_idx" ON "GeminiUsage"("timestamp");

-- AddForeignKey
ALTER TABLE "GeminiUsage" ADD CONSTRAINT "GeminiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
