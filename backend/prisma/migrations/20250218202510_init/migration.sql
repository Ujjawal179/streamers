/*
  Warnings:

  - You are about to drop the column `isVerified` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Youtuber` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Youtuber` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `Youtuber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "isVerified",
DROP COLUMN "password",
DROP COLUMN "verificationToken";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "Youtuber" DROP COLUMN "isVerified",
DROP COLUMN "password",
DROP COLUMN "verificationToken";
