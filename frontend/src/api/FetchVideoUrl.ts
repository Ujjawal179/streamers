import axios from 'axios';

export const fetchVideoUrl = async (hash: string): Promise<string | undefined> => {
    try {
        const response = await axios.get(`http://localhost:3005/video/${hash}`);
        return response.data?.videoUrl;
    } catch (error) {
        const err = error as any;
        console.error(`\nError fetching video URL: ${err.response?.data?.message || err.message}`);
        return undefined;
    }
};