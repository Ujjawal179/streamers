// src/services/nightbotService.ts
import { google } from 'googleapis';
import token from '../../token.json';
import { ClickCounterService } from './clickCounterService';
import { v4 as uuidv4 } from 'uuid';
export class NightbotService {
  private youtube: any;

  constructor() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUrl = process.env.REDIRECT_URL;

    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

    try {
      auth.setCredentials(token);
    } catch (e) {
      throw new Error('No token.json found. Please generate OAuth token first.');
    }

    this.youtube = google.youtube({ version: 'v3', auth });
  }

  async getChannelIdByUsername(channelLink: string): Promise<string | null> {
    try {
      const usernameMatch = channelLink.match(/@([^/]+)/);
      const username = usernameMatch ? usernameMatch[1] : null;

      if (!username) {
        console.error('No username found in channelLink:', channelLink);
        return null;
      }

      const res = await this.youtube.channels.list({
        part: 'id,snippet',
        forHandle: username,
      });

      if (res.data.items && res.data.items.length > 0) {
        const channelId = res.data.items[0].id;
        console.log(`Channel ID for @${username}: ${channelId}`);
        return channelId;
      } else {
        console.log(`No channel found with username: ${username}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching channel ID:', error);
      return null;
    }
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
      console.log("Live")
      return {
        viewers: liveDetails.concurrentViewers || 'Unknown',
        liveChatId: liveDetails.activeLiveChatId,
      };
    } catch (error) {
      console.error('Error fetching live broadcast:', error);
      return null;
    }
  }

  async calculateAverageViews(channelId: string, maxResults: number = 5): Promise<number | null> {
    try {
      // Fetch the channel's uploads playlist ID
      const channelRes = await this.youtube.channels.list({
        part: 'contentDetails',
        id: channelId,
      });

      if (!channelRes.data.items || channelRes.data.items.length === 0) {
        console.log('No channel data found for ID:', channelId);
        return null;
      }

      const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

      // Get the videos from the uploads playlist
      const playlistRes = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults,
      });

      if (!playlistRes.data.items || playlistRes.data.items.length === 0) {
        console.log('No videos found in uploads playlist:', uploadsPlaylistId);
        return null;
      }

      const videoIds = playlistRes.data.items.map((item: { snippet: { resourceId: { videoId: string } } }) => item.snippet.resourceId.videoId);

      // Get view counts for the videos
      const videoRes = await this.youtube.videos.list({
        part: 'statistics',
        id: videoIds.join(','),
      });

      if (!videoRes.data.items || videoRes.data.items.length === 0) {
        console.log('No video statistics found for IDs:', videoIds);
        return null;
      }

      const views = videoRes.data.items.map((item: { statistics: { viewCount: string } }) => parseInt(item.statistics.viewCount, 10));
      const totalViews = views.reduce((acc: number, viewCount: number) => acc + viewCount, 0);
      const averageViews = totalViews / views.length;

      console.log(`Average views for the last ${maxResults} videos: ${averageViews}`);
      return averageViews;
    } catch (error) {
      console.error('Error calculating average views:', error);
      return null;
    }
  }

  private generateRedirectUrl(originalUrl: string, redirectId: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001/api/v1';
    return `${baseUrl}/r/${redirectId}`;
  }

  private parseAndReplaceUrls(message: string, redirectId: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.replace(urlRegex, (url) => {
      return this.generateRedirectUrl(url, redirectId);
    });
  }

  async sendStreamMessage(
    liveChatId: string,
    message: string,
    channelId: string,
    youtuberId: string
  ): Promise<string | null> {
    try {
      console.log("Sending Message:", message);
      const fullUuid = uuidv4(); // Generate full UUID (e.g., "5bf80577-dd2d-470d-9960-aa3dfa67090f")
      const redirectId = fullUuid.split('-')[0];
      const processedMessage = this.parseAndReplaceUrls(message, redirectId);

      const response = await this.youtube.liveChatMessages.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            liveChatId,
            type: 'textMessageEvent',
            textMessageDetails: {
              messageText: processedMessage, // Send message with redirect URL
            },
          },
        },
      });

      const messageId = response.data.id; // YouTube-assigned message ID
      const urls = ClickCounterService.extractUrls(message);
      if (urls.length > 0) {
        await ClickCounterService.storeChatMessage(
          youtuberId,
          channelId,
          liveChatId,
          messageId,
          redirectId, // Store the custom redirectId
          processedMessage,
          message
        );
      }

      return messageId; // Returning YouTube messageId for reference
    } catch (error) {
      console.error('Error posting message:', error);
      return null;
    }
  }
}