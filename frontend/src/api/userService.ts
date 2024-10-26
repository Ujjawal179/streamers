import axios from 'axios';
import { 
  BACKEND_API_URL, 
} from '../config/env';
const BASE_URL: string = BACKEND_API_URL ; // Replace with your actual backend URL

// Type definitions (adjust these based on your actual API response and request types)
// interface UserData {
//   id?: string;
//   name: string;
//   email: string; // Updated to use phone number
//   password: string;
//   userType: string;
//   ifsc: string;
//   accountNumber: string;
//   channelLink: String;
// }

interface LoginData {
  email: string; // Updated to use phone number
  password: string;
  userType: string;
}
interface ApiResponse {
  userType?: string;
  success?: boolean;
  message?: string;
  errors?: { path: string; message: string }[];
  token?: string; // Add token property
  user?: any; // Add user property
  youtuber?: any;
  username?: string;
}

export const registerUser = async (userData: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.errors?.[0].message || 'Registration failed';
      throw new Error(errorMessage);
    }
    data.user.userType = data.userType;
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login a user
export const loginUser = async (loginData: LoginData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    const data = await response.json();
    data.success = true;
    data.user.userType = data.userType;
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: errorMessage };
  }
}


// // Logout a user
// export const logoutUser = async (): Promise<ApiResponse> => {
//   try {
//     const response = await axios.post<ApiResponse>(`${BASE_URL}/logout`, {}, {
//       withCredentials: true, // To send cookies with the request
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error logging out:', error);
//     if (axios.isAxiosError(error) && error.response) {
//       throw error.response.data;
//     }
//     throw new Error('Server error');
//   }
// };

export const logoutUser = () => {
  localStorage.removeItem('user');
  window.location.href = '/login'; // Redirect to login page after logout
};


// Update user data
export const updateUser = async (userData: any) => {
  try {
    const id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : '';
    // console.log(`${BASE_URL}/youtuber/${id}/update`);
    const response = await axios.put<ApiResponse>(`${BASE_URL}/youtuber/${id}/update`, userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};


// // Signup a new user
// export const signupUser = async (userData: UserData): Promise<ApiResponse> => {
//   try {
//     const response = await axios.post<ApiResponse>(`${BASE_URL}/signup`, userData);
//     return response.data;
//   } catch (error) {
//     console.error('Error signing up user:', error);
//     if (axios.isAxiosError(error) && error.response) {
//       throw error.response.data;
//     }
//     throw new Error('Server error');
//   }
// };



export async function fetchPaymentsForYoutuber(youtuberId: string) {
  try {
    const response = await fetch(`${BASE_URL}/youtuber/${youtuberId}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Unexpected response format: Expected JSON');
    }

    const payments = await response.json();
    return payments;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return null;  // Handle error or show a message in the UI
  }
}


export const getUsernameById = async (userId: string): Promise<{ username: string; charge: any } | ApiResponse> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/username/${userId}`
    );

  const user = response.data;
  if (response.status === 404) {
    return { success: false, message: 'Streamer not found, the link is not correct.' };
  }

  if (response.status === 400) {
    return { success: false, message: 'Streamer details are incomplete. If you are an advertiser, please check back later. If you are a streamer, complete your setup to proceed.' };
  }
    return { username: user.username, charge: user.charge };
  } catch (error) {
    console.error('Error fetching username:', error);
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, message: error.response.data.message || 'Failed to fetch username' };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: errorMessage };
  }
};