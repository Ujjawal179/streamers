// src/services/clickCounterService.ts
import prisma from '../config/database';

export class ClickCounterService {
  static extractUrls(message: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.match(urlRegex) || [];
  }

  static async storeChatMessage(
    youtuberId: string,
    channelId: string,
    liveChatId: string,
    messageId: string,
    redirectId: string, // Add redirectId parameter
    messageText: string,
    originalMessage: string
  ): Promise<void> {
    const urls = this.extractUrls(originalMessage);
    await prisma.chatMessage.create({
      data: {
        youtuberId,
        channelId,
        liveChatId,
        messageId,
        redirectId, // Store redirectId
        messageText,
        url: urls.length > 0 ? urls[0] : null,
      },
    });
  }

  static async updateClickCount(messageId: string, clicks: number): Promise<void> {
    await prisma.chatMessage.update({
      where: { messageId },
      data: { clicks },
    });
  }

  static async getClickCount(messageId: string): Promise<number> {
    const message = await prisma.chatMessage.findUnique({
      where: { messageId },
    });
    return message ? message.clicks : 0;
  }

  static async incrementClickAndGetUrl(redirectId: string): Promise<string | null> {
    try {
      const message = await prisma.chatMessage.update({
        where: { redirectId }, // Use redirectId instead of messageId
        data: { clicks: { increment: 1 } },
      });
      return message.url;
    } catch (error) {
      console.error('Error incrementing click count:', error);
      return null;
    }
  }
}