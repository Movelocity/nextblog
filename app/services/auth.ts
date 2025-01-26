import { API_ROUTES } from '../common/config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AuthCheckResponse {
  valid: boolean;
  user?: {
    email: string;
  };
  error?: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(API_ROUTES.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Invalid credentials' }));
    throw new Error(error.message || 'Invalid credentials');
  }

  return response.json();
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(API_ROUTES.CHECK_AUTH, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data: AuthCheckResponse = await response.json();
    
    if (!data.valid) {
      removeAuthToken(); // Clear invalid token
      return false;
    }

    return true;
  } catch (error) {
    removeAuthToken(); // Clear token on error
    return false;
  }
}; 