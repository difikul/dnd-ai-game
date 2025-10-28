-- CreateTable
CREATE TABLE "SpellSlot" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "maximum" INTEGER NOT NULL,
    "current" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpellSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnownSpell" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "spellName" TEXT NOT NULL,
    "spellLevel" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnownSpell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassFeature" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockLevel" INTEGER NOT NULL,
    "usesPerRest" INTEGER,
    "currentUses" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpellSlot_characterId_level_idx" ON "SpellSlot"("characterId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "SpellSlot_characterId_level_key" ON "SpellSlot"("characterId", "level");

-- CreateIndex
CREATE INDEX "KnownSpell_characterId_idx" ON "KnownSpell"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "KnownSpell_characterId_spellName_key" ON "KnownSpell"("characterId", "spellName");

-- CreateIndex
CREATE INDEX "ClassFeature_characterId_idx" ON "ClassFeature"("characterId");

-- AddForeignKey
ALTER TABLE "SpellSlot" ADD CONSTRAINT "SpellSlot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnownSpell" ADD CONSTRAINT "KnownSpell_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassFeature" ADD CONSTRAINT "ClassFeature_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
