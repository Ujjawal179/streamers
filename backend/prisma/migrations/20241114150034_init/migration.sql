-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Youtuber', 'Company');

-- AlterTable
ALTER TABLE "Youtuber" ADD COLUMN     "MagicNumber" TEXT;
