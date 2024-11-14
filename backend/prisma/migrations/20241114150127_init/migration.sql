/*
  Warnings:

  - The `MagicNumber` column on the `Youtuber` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Youtuber" DROP COLUMN "MagicNumber",
ADD COLUMN     "MagicNumber" INTEGER;
