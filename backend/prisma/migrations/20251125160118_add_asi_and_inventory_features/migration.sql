-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "asiHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "pendingASI" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "isAttuned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rarity" TEXT NOT NULL DEFAULT 'common',
ADD COLUMN     "requiresAttunement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statBonuses" JSONB;

-- CreateIndex
CREATE INDEX "Item_isAttuned_idx" ON "Item"("isAttuned");
