-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FootfallEvent";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AmenityBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "memberId" TEXT,
    "memberName" TEXT NOT NULL,
    "memberFlat" TEXT,
    "slotDate" DATETIME NOT NULL,
    "slotHour" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "bookedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AmenityBooking_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
