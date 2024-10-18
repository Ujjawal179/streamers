import axios from 'axios';

const BASE_URL: string = "http://localhost:3001" ; // Replace with your actual backend URL

// Type definitions (adjust these based on your actual API response and request types)
interface UserData {
  role: string;
  name: string;
  mail: string; // Updated to use phone number
  password: string;
}

interface LoginData {
  mail: string; // Updated to use phone number
  password: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  token?: string; // Add the token property as optional
  // Define the structure of the API response
}

// Register a new user
export const registerUser = async (userData: UserData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    console.log(response);
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login a user
export const loginUser = async (loginData: LoginData): Promise<ApiResponse> => {
  try {
    const response = await axios.post<ApiResponse>(`${BASE_URL}/login`, loginData);

    const { token } = response.data as { token: string };

    // If login is successful, store the token in localStorage
    if (token) {
      localStorage.setItem('user', JSON.stringify(token));
      return { success: true, message: 'Login successful', token };
    } else {
      return { success: false, message: 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, message: error.response.data.message || 'Server error' };
    }
    return { success: false, message: 'Server error' };
  }
};

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
  localStorage.removeItem('authToken');
  window.location.href = '/login'; // Redirect to login page after logout
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