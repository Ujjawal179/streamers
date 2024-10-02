/*
  Warnings:

  - You are about to drop the column `description` on the `Youtuber` table. All the data in the column will be lost.
  - You are about to drop the `ads` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `email` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Youtuber` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Youtuber` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ads" DROP CONSTRAINT "ads_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ads" DROP CONSTRAINT "ads_youtuberId_fkey";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Youtuber" DROP COLUMN "description",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "ads";

-- DropEnum
DROP TYPE "AdsStatus";
