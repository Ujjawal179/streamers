import axios from 'axios';
import { BACKEND_API_URL, PINATA_API_URL, PINATA_JWT } from '../config/env';

export const uploadMedia = async (videoFile: File) => {
    if (!videoFile) {
        console.log('Please select a video file first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', videoFile);

    try {
        // Step 1: Upload to Pinata
        console.log('Uploading file to Pinata:', videoFile.name);
        const pinataResponse = await axios.post(PINATA_API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${PINATA_JWT}`
            }
        });

        const { IpfsHash } = pinataResponse.data;
        console.log('Upload to Pinata Successful! IPFS Hash:', IpfsHash);

        // Step 2: Send hash to your backend
        const backendResponse = await axios.post(BACKEND_API_URL, { hash: IpfsHash });
        console.log('Hash sent to backend:', backendResponse.data);

        return IpfsHash;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        return undefined;
    }
};

// import axios from 'axios';
// import { fetchVideoUrl } from './FetchVideoUrl';
// import { postHash } from './postHash';

// const API_URL = 'http://localhost:3001/upload';


// // will add more parameters here later
// export const uploadMedia = async (videoFile: File) => {
//     if (!videoFile) {
//         console.log('Please select a video file first.');
//         return;
//     }

//     const formData = new FormData();
//     formData.append('file', videoFile);

//     try {
//         const response = await axios.post(API_URL, formData);
//         const { hash } = response.data;
//         console.log('Upload Successful! IPFS Hash: ' + hash);

//         await postHash(hash);
//         return fetchVideoUrl(hash);
//     } catch (error) {
//         const errorMessage = (error as any).response?.data?.message || (error as any).message;
//         console.log('Error: ' + errorMessage);
//         return undefined;
//     }
// };