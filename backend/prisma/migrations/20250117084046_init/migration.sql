-- AlterTable
ALTER TABLE "StreamAnalytics" ALTER COLUMN "totalViews" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Youtuber" ADD COLUMN     "charge" DOUBLE PRECISION NOT NULL DEFAULT 0;
