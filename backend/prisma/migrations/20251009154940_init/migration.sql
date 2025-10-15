-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "hitPoints" INTEGER NOT NULL,
    "maxHitPoints" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "background" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "currentLocation" TEXT NOT NULL,
    "questLog" JSONB NOT NULL DEFAULT '[]',
    "worldState" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "damage" TEXT,
    "armorValue" INTEGER,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "connectedTo" JSONB NOT NULL DEFAULT '[]',
    "npcs" JSONB,
    "encounters" JSONB,
    "discovered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_sessionToken_key" ON "GameSession"("sessionToken");

-- CreateIndex
CREATE INDEX "GameSession_sessionToken_idx" ON "GameSession"("sessionToken");

-- CreateIndex
CREATE INDEX "GameSession_characterId_idx" ON "GameSession"("characterId");

-- CreateIndex
CREATE INDEX "GameSession_lastPlayedAt_idx" ON "GameSession"("lastPlayedAt");

-- CreateIndex
CREATE INDEX "Message_sessionId_idx" ON "Message"("sessionId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Item_characterId_idx" ON "Item"("characterId");

-- CreateIndex
CREATE INDEX "Item_equipped_idx" ON "Item"("equipped");

-- CreateIndex
CREATE UNIQUE INDEX "WorldLocation_name_key" ON "WorldLocation"("name");

-- CreateIndex
CREATE INDEX "WorldLocation_name_idx" ON "WorldLocation"("name");

-- CreateIndex
CREATE INDEX "WorldLocation_type_idx" ON "WorldLocation"("type");

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
