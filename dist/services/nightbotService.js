"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NightbotService = void 0;
// src/services/nightbotService.ts
const googleapis_1 = require("googleapis");
const token_json_1 = __importDefault(require("../../token.json"));
const clickCounterService_1 = require("./clickCounterService");
const uuid_1 = require("uuid");
class NightbotService {
    constructor() {
        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;
        const redirectUrl = process.env.REDIRECT_URL;
        const auth = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUrl);
        try {
            auth.setCredentials(token_json_1.default);
        }
        catch (e) {
            throw new Error('No token.json found. Please generate OAuth token first.');
        }
        this.youtube = googleapis_1.google.youtube({ version: 'v3', auth });
    }
    getChannelIdByUsername(channelLink) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const usernameMatch = channelLink.match(/@([^/]+)/);
                const username = usernameMatch ? usernameMatch[1] : null;
                if (!username) {
                    console.error('No username found in channelLink:', channelLink);
                    return null;
                }
                const res = yield this.youtube.channels.list({
                    part: 'id,snippet',
                    forHandle: username,
                });
                if (res.data.items && res.data.items.length > 0) {
                    const channelId = res.data.items[0].id;
                    console.log(`Channel ID for @${username}: ${channelId}`);
                    return channelId;
                }
                else {
                    console.log(`No channel found with username: ${username}`);
                    return null;
                }
            }
            catch (error) {
                console.error('Error fetching channel ID:', error);
                return null;
            }
        });
    }
    updateRealTimeViews(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchResponse = yield this.youtube.search.list({
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
                const videoResponse = yield this.youtube.videos.list({
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
                console.log("Live");
                return {
                    viewers: liveDetails.concurrentViewers || 'Unknown',
                    liveChatId: liveDetails.activeLiveChatId,
                };
            }
            catch (error) {
                console.error('Error fetching live broadcast:', error);
                return null;
            }
        });
    }
    calculateAverageViews(channelId_1) {
        return __awaiter(this, arguments, void 0, function* (channelId, maxResults = 5) {
            try {
                // Fetch the channel's uploads playlist ID
                const channelRes = yield this.youtube.channels.list({
                    part: 'contentDetails',
                    id: channelId,
                });
                if (!channelRes.data.items || channelRes.data.items.length === 0) {
                    console.log('No channel data found for ID:', channelId);
                    return null;
                }
                const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;
                // Get the videos from the uploads playlist
                const playlistRes = yield this.youtube.playlistItems.list({
                    part: 'snippet',
                    playlistId: uploadsPlaylistId,
                    maxResults: maxResults,
                });
                if (!playlistRes.data.items || playlistRes.data.items.length === 0) {
                    console.log('No videos found in uploads playlist:', uploadsPlaylistId);
                    return null;
                }
                const videoIds = playlistRes.data.items.map((item) => item.snippet.resourceId.videoId);
                // Get view counts for the videos
                const videoRes = yield this.youtube.videos.list({
                    part: 'statistics',
                    id: videoIds.join(','),
                });
                if (!videoRes.data.items || videoRes.data.items.length === 0) {
                    console.log('No video statistics found for IDs:', videoIds);
                    return null;
                }
                const views = videoRes.data.items.map((item) => parseInt(item.statistics.viewCount, 10));
                const totalViews = views.reduce((acc, viewCount) => acc + viewCount, 0);
                const averageViews = totalViews / views.length;
                console.log(`Average views for the last ${maxResults} videos: ${averageViews}`);
                return averageViews;
            }
            catch (error) {
                console.error('Error calculating average views:', error);
                return null;
            }
        });
    }
    generateRedirectUrl(originalUrl, redirectId) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001/api/v1';
        return `${baseUrl}/r/${redirectId}`;
    }
    parseAndReplaceUrls(message, redirectId) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return message.replace(urlRegex, (url) => {
            return this.generateRedirectUrl(url, redirectId);
        });
    }
    sendStreamMessage(liveChatId, message, channelId, youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Sending Message:", message);
                const fullUuid = (0, uuid_1.v4)(); // Generate full UUID (e.g., "5bf80577-dd2d-470d-9960-aa3dfa67090f")
                const redirectId = fullUuid.split('-')[0];
                const processedMessage = this.parseAndReplaceUrls(message, redirectId);
                const response = yield this.youtube.liveChatMessages.insert({
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
                const urls = clickCounterService_1.ClickCounterService.extractUrls(message);
                if (urls.length > 0) {
                    yield clickCounterService_1.ClickCounterService.storeChatMessage(youtuberId, channelId, liveChatId, messageId, redirectId, // Store the custom redirectId
                    processedMessage, message);
                }
                return messageId; // Returning YouTube messageId for reference
            }
            catch (error) {
                console.error('Error posting message:', error);
                return null;
            }
        });
    }
}
exports.NightbotService = NightbotService;
