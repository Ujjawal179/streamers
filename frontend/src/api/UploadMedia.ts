import axios, { AxiosError } from 'axios';
import { 
  BACKEND_API_URL, 
} from '../config/env';

// Types
interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
}
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
}

interface BackendResponse {
  message: string;
  data: {
    url: string;
    public_id: string;
    resource_type: string;
    uploaded_at: string;
  };
}

export class UploadError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'UploadError';
  }
}

export const uploadMedia = async (
  file: File, 
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) {
    throw new UploadError('Please select a file to upload.');
  }

  if (!userId) {
    throw new UploadError('User ID is required.');
  }

  try {
    console.log("first")
    // Step 1: Get signature and upload parameters from backend
    const { data: signatureData } = await axios.get<SignatureResponse>(
      `${BACKEND_API_URL}/get-signature`
    );
    console.log(signatureData)
    // Step 2: Prepare form data for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    // const { data: moderationData } = await axios.post(
    //   `${MODERATION_API_URL}`,
    //   formData,
    //   {
    //     headers: { 'Content-Type': 'multipart/form-data' }
    //   }
    // );

    // if (moderationData.result === 'rejected') {
    //   throw new UploadError('This video contains inappropriate content and cannot be uploaded.');
    // }
    console.log("second")
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    formData.append('upload_preset', signatureData.uploadPreset);
      console.log("third")
    // Step 3: Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
    const { data: cloudinaryData } = await axios.post<CloudinaryResponse>(
      cloudinaryUrl,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      }
    );
    console.log("forth")
    console.log(cloudinaryData);

    // Step 4: Save upload details in backend
    const { data: backendData } = await axios.post<BackendResponse>(
      `${BACKEND_API_URL}/upload/${userId}`,
      {
        url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        resource_type: cloudinaryData.resource_type
      }
    );

    return cloudinaryData.secure_url;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.log(error);
    }
    throw new UploadError(
      'An unexpected error occurred during upload',
      error instanceof Error ? error : undefined
    );
  }
};

// import axios, { AxiosError } from 'axios';
// import { BACKEND_API_URL, MODERATION_API_URL } from '../config/env';

// interface SignatureResponse {
//   signature: string;
//   timestamp: number;
//   folder: string;
//   cloudName: string;
//   apiKey: string;
//   uploadPreset: string;
// }

// interface CloudinaryResponse {
//   secure_url: string;
//   public_id: string;
//   resource_type: string;
// }

// interface BackendResponse {
//   message: string;
//   data: {
//     url: string;
//     public_id: string;
//     resource_type: string;
//     uploaded_at: string;
//   };
// }

// interface ModerationResponse {
//   result: 'approved' | 'rejected';
//   message: string;
// }

// export class UploadError extends Error {
//   constructor(message: string, public readonly originalError?: Error) {
//     super(message);
//     this.name = 'UploadError';
//   }
// }

// export const uploadMedia = async (
//   file: File, 
//   userId: string,
//   onProgress?: (progress: number) => void
// ): Promise<string> => {
//   if (!file) {
//     throw new UploadError('Please select a file to upload.');
//   }

//   if (!userId) {
//     throw new UploadError('User ID is required.');
//   }

//   try {
//     // Step 1: Content moderation check
//     const moderationFormData = new FormData();
//     moderationFormData.append('file', file);
    
//     const { data: moderationData } = await axios.post<ModerationResponse>(
//       MODERATION_API_URL,
//       moderationFormData,
//       {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         // Add timeout for large files
//         timeout: 300000, // 5 minutes
//         // Allow credentials if needed
//         withCredentials: true
//       }
//     );

//     if (moderationData.result === 'rejected') {
//       throw new UploadError(moderationData.message || 'Content moderation failed.');
//     }

//     // Step 2: Get signature and upload parameters
//     const { data: signatureData } = await axios.get<SignatureResponse>(
//       `${BACKEND_API_URL}/get-signature`,
//       { withCredentials: true }
//     );

//     // Step 3: Prepare Cloudinary upload
//     const cloudinaryFormData = new FormData();
//     cloudinaryFormData.append('file', file);
//     cloudinaryFormData.append('api_key', signatureData.apiKey);
//     cloudinaryFormData.append('timestamp', signatureData.timestamp.toString());
//     cloudinaryFormData.append('signature', signatureData.signature);
//     cloudinaryFormData.append('folder', signatureData.folder);
//     cloudinaryFormData.append('upload_preset', signatureData.uploadPreset);

//     // Step 4: Upload to Cloudinary
//     const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
//     const { data: cloudinaryData } = await axios.post<CloudinaryResponse>(
//       cloudinaryUrl,
//       cloudinaryFormData,
//       {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         onUploadProgress: (progressEvent) => {
//           if (onProgress && progressEvent.total) {
//             const percentCompleted = Math.round(
//               (progressEvent.loaded * 100) / progressEvent.total
//             );
//             onProgress(percentCompleted);
//           }
//         },
//         // Add timeout for large files
//         timeout: 600000 // 10 minutes
//       }
//     );

//     // Step 5: Save upload details
//     const { data: backendData } = await axios.post<BackendResponse>(
//       `${BACKEND_API_URL}/upload/${userId}`,
//       {
//         url: cloudinaryData.secure_url,
//         public_id: cloudinaryData.public_id,
//         resource_type: cloudinaryData.resource_type
//       },
//       { withCredentials: true }
//     );

//     return cloudinaryData.secure_url;

//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       const axiosError = error as AxiosError<any>;
      
//       if (axiosError.code === 'ECONNABORTED') {
//         throw new UploadError('Upload timed out. Please try again.');
//       }
      
//       const errorMessage = axiosError.response?.data?.message 
//         || axiosError.message 
//         || 'An unexpected error occurred during upload';
      
//       throw new UploadError(errorMessage, axiosError);
//     }
    
//     throw new UploadError(
//       'An unexpected error occurred during upload',
//       error instanceof Error ? error : undefined
//     );
//   }
// };