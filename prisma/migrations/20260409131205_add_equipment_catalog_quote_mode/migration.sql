-- CreateTable
CREATE TABLE "EquipmentCatalogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "series" TEXT,
    "imageUrl" TEXT,
    "imageUrl2" TEXT,
    "specsJson" TEXT,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "quoteMode" TEXT NOT NULL DEFAULT 'ITEMIZED',
    "totalAmount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("acceptedAt", "createdAt", "id", "leadId", "notes", "sentAt", "status", "updatedAt") SELECT "acceptedAt", "createdAt", "id", "leadId", "notes", "sentAt", "status", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_leadId_key" ON "Quote"("leadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentCatalogItem_sku_key" ON "EquipmentCatalogItem"("sku");
