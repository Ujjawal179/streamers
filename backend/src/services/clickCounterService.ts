// src/services/clickCounterService.ts
import prisma from '../config/database';

export class ClickCounterService {
  // Extract URLs from a message
  static extractUrls(message: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.match(urlRegex) || [];
  }

  // Store the chat message in the database
  static async storeChatMessage(
    youtuberId: string,
    channelId: string,
    liveChatId: string,
    messageId: string,
    messageText: string
  ): Promise<void> {
    const urls = this.extractUrls(messageText);
    await prisma.chatMessage.create({
      data: {
        youtuberId,
        channelId,
        liveChatId,
        messageId,
        messageText,
        url: urls.length > 0 ? urls[0] : null, // Store first URL if present
      },
    });
  }

  // Manually update click count (for external analytics integration)
  static async updateClickCount(messageId: string, clicks: number): Promise<void> {
    await prisma.chatMessage.update({
      where: { messageId },
      data: { clicks },
    });
  }

  // Get click count for a message
  static async getClickCount(messageId: string): Promise<number> {
    const message = await prisma.chatMessage.findUnique({
      where: { messageId },
    });
    return message ? message.clicks : 0;
  }
}