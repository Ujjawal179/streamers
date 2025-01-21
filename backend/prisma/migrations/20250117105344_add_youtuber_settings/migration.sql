-- AlterTable
ALTER TABLE "Youtuber" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "alertBoxUrl" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "channelLink" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "panCard" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "timeout" INTEGER DEFAULT 30,
ADD COLUMN     "upiId" TEXT;
