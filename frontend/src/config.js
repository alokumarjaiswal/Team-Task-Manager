// Central API configuration — reads from env at build time (Vite)
// Set VITE_API_URL in Railway environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_URL;
