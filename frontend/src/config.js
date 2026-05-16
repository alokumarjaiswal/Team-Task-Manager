// Central API configuration — reads from env at build time (Vite)
// Set VITE_API_URL in Railway environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
	throw new Error('VITE_API_URL is required in production. Set it before building the frontend on Railway.');
}

export default API_URL;
