-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'COMPANY', 'YOUTUBER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PLAYED', 'FAILED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PROCESSING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "youtuberId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "liveChatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "redirectId" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "url" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationToken" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "zip" INTEGER,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Youtuber" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelName" TEXT,
    "verificationToken" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "averageViews" INTEGER NOT NULL DEFAULT 0,
    "currentCCV" INTEGER NOT NULL DEFAULT 0,
    "currentStreamId" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "MagicNumber" INTEGER NOT NULL,
    "charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "panCard" TEXT,
    "upiId" TEXT,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "timeout" INTEGER DEFAULT 30,
    "channelLink" TEXT[],
    "phoneNumber" TEXT,
    "alertBoxUrl" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "address" TEXT,
    "vat" TEXT,
    "country" TEXT,
    "city" TEXT,
    "zip" INTEGER,

    CONSTRAINT "Youtuber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "targetViews" INTEGER NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "brandLink" TEXT,
    "companyId" TEXT NOT NULL,
    "currentViews" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "videoUrl" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "companyId" TEXT NOT NULL,
    "youtuberId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "playedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSchedule" (
    "id" TEXT NOT NULL,
    "youtuberId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "maxAdsPerHour" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamAnalytics" (
    "id" TEXT NOT NULL,
    "youtuberId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "averageCCV" INTEGER NOT NULL,
    "peakCCV" INTEGER NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "adsPlayed" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "payoutId" TEXT,
    "transactionId" TEXT,
    "playsNeeded" INTEGER NOT NULL DEFAULT 1,
    "earnings" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT NOT NULL,
    "youtuberId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampaignToYoutuber" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_messageId_key" ON "ChatMessage"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_redirectId_key" ON "ChatMessage"("redirectId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Youtuber_userId_key" ON "Youtuber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Youtuber_MagicNumber_key" ON "Youtuber"("MagicNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignToYoutuber_AB_unique" ON "_CampaignToYoutuber"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignToYoutuber_B_index" ON "_CampaignToYoutuber"("B");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_youtuberId_fkey" FOREIGN KEY ("youtuberId") REFERENCES "Youtuber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Youtuber" ADD CONSTRAINT "Youtuber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_youtuberId_fkey" FOREIGN KEY ("youtuberId") REFERENCES "Youtuber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSchedule" ADD CONSTRAINT "AdSchedule_youtuberId_fkey" FOREIGN KEY ("youtuberId") REFERENCES "Youtuber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamAnalytics" ADD CONSTRAINT "StreamAnalytics_youtuberId_fkey" FOREIGN KEY ("youtuberId") REFERENCES "Youtuber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_youtuberId_fkey" FOREIGN KEY ("youtuberId") REFERENCES "Youtuber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToYoutuber" ADD CONSTRAINT "_CampaignToYoutuber_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToYoutuber" ADD CONSTRAINT "_CampaignToYoutuber_B_fkey" FOREIGN KEY ("B") REFERENCES "Youtuber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
