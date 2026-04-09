/*
  Warnings:

  - Added the required column `updatedAt` to the `EquipmentRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `QuoteLineItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServicePricingConfig` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EquipmentRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sizeCategory" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EquipmentRecommendation" ("id", "items", "sizeCategory") SELECT "id", "items", "sizeCategory" FROM "EquipmentRecommendation";
DROP TABLE "EquipmentRecommendation";
ALTER TABLE "new_EquipmentRecommendation" RENAME TO "EquipmentRecommendation";
CREATE UNIQUE INDEX "EquipmentRecommendation_sizeCategory_key" ON "EquipmentRecommendation"("sizeCategory");
CREATE TABLE "new_QuoteLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL,
    "oneTimeFee" INTEGER,
    "monthlyFee" INTEGER,
    "takeRatePct" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuoteLineItem" ("id", "moduleKey", "monthlyFee", "oneTimeFee", "pricingType", "quoteId", "takeRatePct") SELECT "id", "moduleKey", "monthlyFee", "oneTimeFee", "pricingType", "quoteId", "takeRatePct" FROM "QuoteLineItem";
DROP TABLE "QuoteLineItem";
ALTER TABLE "new_QuoteLineItem" RENAME TO "QuoteLineItem";
CREATE TABLE "new_ServicePricingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleKey" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL,
    "defaultOneTimeFee" INTEGER,
    "defaultMonthlyFee" INTEGER,
    "defaultTakeRatePct" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ServicePricingConfig" ("defaultMonthlyFee", "defaultOneTimeFee", "defaultTakeRatePct", "id", "moduleKey", "pricingType") SELECT "defaultMonthlyFee", "defaultOneTimeFee", "defaultTakeRatePct", "id", "moduleKey", "pricingType" FROM "ServicePricingConfig";
DROP TABLE "ServicePricingConfig";
ALTER TABLE "new_ServicePricingConfig" RENAME TO "ServicePricingConfig";
CREATE UNIQUE INDEX "ServicePricingConfig_moduleKey_key" ON "ServicePricingConfig"("moduleKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
