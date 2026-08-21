-- CreateTable
CREATE TABLE "FplCache" (
    "key" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FplCache_pkey" PRIMARY KEY ("key")
);
