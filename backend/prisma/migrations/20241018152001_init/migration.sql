-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Youtuber" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "accountNumber" DROP NOT NULL,
ALTER COLUMN "ifsc" DROP NOT NULL;
