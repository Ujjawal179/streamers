import axios from 'axios';
import { BACKEND_API_URL, CLOUDINARY_API_URL, CLOUDINARY_API_KEY } from '../config/env';

export const uploadMedia = async (videoFile: File, userId: string): Promise<string | undefined> => {
  if (!videoFile) {
    console.log('Please select a video file first.');
    return undefined;
  }

  try {
    // Step 1: Get signature from the backend
    const signatureResponse = await axios.get(`${BACKEND_API_URL}/get-signature`);
    const { signature, timestamp } = signatureResponse.data;

    // Step 2: Prepare form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    // Step 3: Upload the video to Cloudinary
    console.log('Uploading file to Cloudinary:', videoFile.name);
    const cloudinaryResponse = await axios.post(CLOUDINARY_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    const { secure_url, public_id, resource_type } = cloudinaryResponse.data;
    console.log('Upload to Cloudinary Successful! URL:', secure_url);

    // Step 4: Send the URL to your backend
    const backendResponse = await axios.post(`${BACKEND_API_URL}/upload/${userId}`, {
      url: secure_url,
      public_id,
      resource_type
    });
    console.log('URL sent to backend:', backendResponse.data);

    return secure_url;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    return undefined;
  }
};