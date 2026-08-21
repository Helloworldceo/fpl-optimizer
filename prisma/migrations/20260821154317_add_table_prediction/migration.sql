-- CreateTable
CREATE TABLE "TablePrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TablePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TablePrediction_userId_season_idx" ON "TablePrediction"("userId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "TablePrediction_userId_season_teamId_key" ON "TablePrediction"("userId", "season", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TablePrediction_userId_season_position_key" ON "TablePrediction"("userId", "season", "position");

-- AddForeignKey
ALTER TABLE "TablePrediction" ADD CONSTRAINT "TablePrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
