-- No-op: center onboardingTag / provisioningChannel tagging was reverted from the Prisma schema.
-- Existing databases that already applied the previous ALTERs may still have these columns; SQLite ignores extras for Prisma.
SELECT 1;
