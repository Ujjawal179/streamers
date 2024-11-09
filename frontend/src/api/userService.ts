import axios from 'axios';
import { API_ROUTES } from '../routes/routes';

interface LoginData {
  email: string;
  password: string;
  userType: string;
}

interface ApiResponse {
  userType?: string;
  success?: boolean;
  message?: string;
  errors?: { path: string; message: string }[];
  token?: string;
  user?: any;
  youtuber?: any;
  username?: string;
}

export const registerUser = async (userData: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(API_ROUTES.AUTH.REGISTER, {
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

export const loginUser = async (loginData: LoginData): Promise<ApiResponse> => {
  try {
    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

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
};

export const logoutUser = () => {
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const updateUser = async (userData: any) => {
  try {
    const id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : '';
    const response = await axios.put<ApiResponse>(API_ROUTES.YOUTUBER.UPDATE(id), userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};

export const fetchPaymentsForYoutuber = async (youtuberId: string) => {
  try {
    const response = await fetch(API_ROUTES.PAYMENT.GET_YOUTUBER_PAYMENTS(youtuberId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    return null;
  }
};

export const getUsernameById = async (userId: string): Promise<{ username: string; charge: any } | ApiResponse> => {
  try {
    const response = await axios.get(API_ROUTES.YOUTUBER.GET_USERNAME(userId));

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