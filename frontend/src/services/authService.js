// blog-app/src/services/authService.js

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
const TOKEN_KEY = 'userToken'; // Key for storing JWT in localStorage

/**
 * Registers a new user.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} Contains token and user info if successful.
 */
const register = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed.');
    }

    // If registration successful, store the token
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};

/**
 * Logs in an existing user.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} Contains token and user info if successful.
 */
const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    // If login successful, store the token
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

/**
 * Logs out the current user by removing the token from localStorage.
 */
const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  console.log("User logged out.");
};

/**
 * Retrieves the current user's token from localStorage.
 * @returns {string|null} The JWT token or null if not found.
 */
const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Decodes the JWT to get user information (username, id).
 * NOTE: This is for convenience on the client-side. The token should always be verified on the server.
 * @returns {object|null} The decoded user payload or null if token is invalid/missing.
 */
const getCurrentUser = () => {
  const token = getToken();
  if (!token) {
    return null;
  }
  try {
    // This is a basic client-side decode. A real app might use a library like 'jwt-decode'.
    // For now, we'll just extract the payload part.
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    // Check if token has expired (exp is in seconds, Date.now() is milliseconds)
    if (decoded.exp * 1000 < Date.now()) {
      console.warn("JWT expired. Logging out.");
      logout(); // Log out if token is expired
      return null;
    }
    return decoded; // Returns { id: ..., username: ..., exp: ..., iat: ... }
  } catch (e) {
    console.error("Error decoding token:", e);
    logout(); // Clear invalid token
    return null;
  }
};

export default {
  register,
  login,
  logout,
  getToken,
  getCurrentUser,
};