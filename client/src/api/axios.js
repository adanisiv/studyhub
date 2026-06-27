import axios from 'axios';

// Create an Axios instance with the backend base URL.
// All requests will be relative to this: API.get('/posts') → GET http://localhost:5000/api/posts
const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Runs BEFORE every request is sent.
// Reads the JWT from localStorage (stored there after login) and adds it to
// the Authorization header so the backend auth middleware can verify the user.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // must return config to continue the request
});

// Runs on EVERY response, before the calling code sees it.
// If the backend returns 401 (unauthorized — e.g. token expired), automatically:
//   1. Clear the stored credentials from localStorage
//   2. Redirect to the login page
// This prevents the user from being stuck with stale data in a broken state.
API.interceptors.response.use(
  (res) => res, // success: just pass the response through unchanged

  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // hard redirect clears all React state
    }
    return Promise.reject(err); // re-throw so the calling code can handle it
  }
);

export default API;
