import axios from 'axios';

const BASE_URL: string = "" ; // Replace with your actual backend URL

// Type definitions (adjust these based on your actual API response and request types)
interface UserData {
  role: string;
  name: string;
  phone: string; // Updated to use phone number
  password: string;
}

interface LoginData {
  phone: string; // Updated to use phone number
  password: string;
}

interface ApiResponse {
  // Define the structure of the API response
}

// Register a new user
export const registerUser = async (userData: UserData): Promise<ApiResponse> => {
  try {
    const response = await axios.post<ApiResponse>(`${BASE_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};

// Login a user
export const loginUser = async (loginData: LoginData): Promise<ApiResponse> => {
  try {
    const response = await axios.post<ApiResponse>(`${BASE_URL}/login`, loginData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};

// Logout a user
export const logoutUser = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.post<ApiResponse>(`${BASE_URL}/logout`, {}, {
      withCredentials: true, // To send cookies with the request
    });
    return response.data;
  } catch (error) {
    console.error('Error logging out:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};

// Update user data
export const updateUser = async (userData: UserData): Promise<ApiResponse> => {
  try {
    const response = await axios.put<ApiResponse>(`${BASE_URL}/update`, userData, {
      withCredentials: true, // To send cookies with the request
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};

// Get user by ID (optional if needed)
export const getUserById = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get<ApiResponse>(`${BASE_URL}/user/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};


// Signup a new user
export const signupUser = async (userData: UserData): Promise<ApiResponse> => {
  try {
    const response = await axios.post<ApiResponse>(`${BASE_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    console.error('Error signing up user:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};