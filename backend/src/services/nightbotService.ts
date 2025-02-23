// nightbotService.ts
import { google } from 'googleapis';

export class NightbotService {
  private youtube: any;
  
  constructor() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUrl = process.env.REDIRECT_URL;

    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    
    try {
      const token = require('./token.json');
      auth.setCredentials(token);
    } catch (e) {
      throw new Error('No token.json found. Please generate OAuth token first.');
    }

    this.youtube = google.youtube({ version: 'v3', auth });
  }

  async updateRealTimeViews(channelId: string): Promise<{ viewers: string; liveChatId?: string } | null> {
    try {
      const searchResponse = await this.youtube.search.list({
        part: 'id',
        channelId: channelId,
        eventType: 'live',
        type: 'video',
        maxResults: 1,
      });

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return null;
      }

      const videoId = searchResponse.data.items[0].id.videoId;
      const videoResponse = await this.youtube.videos.list({
        part: 'snippet,liveStreamingDetails',
        id: videoId,
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        return null;
      }

      const video = videoResponse.data.items[0];
      const liveDetails = video.liveStreamingDetails;

      if (!liveDetails || liveDetails.actualEndTime) {
        return null;
      }

      if (!liveDetails.concurrentViewers && !liveDetails.activeLiveChatId) {
        return null;
      }

      return {
        viewers: liveDetails.concurrentViewers || 'Unknown',
        liveChatId: liveDetails.activeLiveChatId
      };
    } catch (error) {
      console.error('Error fetching live broadcast:', error);
      return null;
    }
  }

  async sendStreamMessage(liveChatId: string, message: string): Promise<string | null> {
    try {
      const response = await this.youtube.liveChatMessages.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            liveChatId,
            type: 'textMessageEvent',
            textMessageDetails: {
              messageText: message,
            },
          },
        },
      });
      return response.data.id;
    } catch (error) {
      console.error('Error posting message:', error);
      return null;
    }
  }
}