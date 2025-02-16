/*
  Warnings:

  - The `channelLink` column on the `Youtuber` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "zip" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "payoutId" TEXT;

-- AlterTable
ALTER TABLE "Youtuber" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "vat" TEXT,
ADD COLUMN     "zip" INTEGER,
ALTER COLUMN "channelName" DROP NOT NULL,
DROP COLUMN "channelLink",
ADD COLUMN     "channelLink" TEXT[];
