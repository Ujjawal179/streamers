import axios from 'axios';
import { fetchVideoUrl } from './FetchVideoUrl';
import { postHash } from './postHash';

const API_URL = 'http://localhost:3005/upload';


// will add more parameters here later
export const uploadMedia = async (videoFile: File) => {
    if (!videoFile) {
        console.log('Please select a video file first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', videoFile);

    try {
        const response = await axios.post(API_URL, formData);
        const { hash } = response.data;
        console.log('Upload Successful! IPFS Hash: ' + hash);

        await postHash(hash);
        return fetchVideoUrl(hash);
    } catch (error) {
        const errorMessage = (error as any).response?.data?.message || (error as any).message;
        console.log('Error: ' + errorMessage);
        return undefined;
    }
};