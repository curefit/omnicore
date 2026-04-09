-- AlterTable
ALTER TABLE "EquipmentAsset" ADD COLUMN "catalogItemSku" TEXT;
ALTER TABLE "EquipmentAsset" ADD COLUMN "installationDate" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EquipmentCatalogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "series" TEXT,
    "imageUrl" TEXT,
    "imageUrl2" TEXT,
    "specsJson" TEXT,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "minPricePerUnit" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatestVersion" BOOLEAN NOT NULL DEFAULT true,
    "supersedesSku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EquipmentCatalogItem" ("category", "createdAt", "id", "imageUrl", "imageUrl2", "isHighlight", "name", "series", "sku", "specsJson", "updatedAt") SELECT "category", "createdAt", "id", "imageUrl", "imageUrl2", "isHighlight", "name", "series", "sku", "specsJson", "updatedAt" FROM "EquipmentCatalogItem";
DROP TABLE "EquipmentCatalogItem";
ALTER TABLE "new_EquipmentCatalogItem" RENAME TO "EquipmentCatalogItem";
CREATE UNIQUE INDEX "EquipmentCatalogItem_sku_key" ON "EquipmentCatalogItem"("sku");
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "quoteMode" TEXT NOT NULL DEFAULT 'ITEMIZED',
    "totalAmount" INTEGER,
    "revisionRound" INTEGER NOT NULL DEFAULT 0,
    "revisionNotes" TEXT,
    "revisionEquipmentJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("acceptedAt", "createdAt", "id", "leadId", "notes", "quoteMode", "sentAt", "status", "totalAmount", "updatedAt") SELECT "acceptedAt", "createdAt", "id", "leadId", "notes", "quoteMode", "sentAt", "status", "totalAmount", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_leadId_key" ON "Quote"("leadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
