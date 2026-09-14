// Base configuration for your FastAPI backend
const API_BASE_URL = "https://swiftbill-backend-3t3u.onrender.com";

/**
 * Universal wrapper for backend API requests using fetch
 * @param {string} endpoint - The API path (e.g. "/auth/login", "/wallet/deposit")
 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
 * @param {object|null} body - Request payload object
 * @returns {Promise<any>} Response JSON data
 */
async function apiRequest(endpoint, method = "GET", body = null) {
  // Retrieve token from storage (checks admin first, then client token)
  const token = localStorage.getItem("adminToken") || localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
  };

  // Attach Bearer Token if present
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  // Stringify payload if body is present
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Parse JSON response
    const data = await response.json().catch(() => ({}));

    // Handle Unauthenticated / Unauthorized session expiry
    if (response.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("username");

      // Redirect to auth page if not already there
      if (!window.location.pathname.includes("auth.html")) {
        window.location.href = "auth.html";
      }
      throw new Error(data.detail || "Session expired. Please log in again.");
    }

    // Handle Server Error Responses (HTTP 4xx/5xx)
    if (!response.ok) {
      const errorMessage = data.detail || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
}

/**
 * Helper to safely logout and clear local storage credentials
 */
function logoutUser() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("username");
  window.location.href = "auth.html";
}