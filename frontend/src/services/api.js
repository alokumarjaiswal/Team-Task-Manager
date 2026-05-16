// Centralized API service — all HTTP calls go through here
// Benefits: single place to add auth headers, error handling, base URL

import axios from 'axios';
import API_URL from '../config';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (data) => api.post('/auth/signup', data),
};

// User APIs
export const userAPI = {
  getAll: () => api.get('/users'),
  getMe: () => api.get('/users/me'),
  delete: (id) => api.delete(`/users/${id}`),
  setRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

// Project APIs
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Task APIs
export const taskAPI = {
  getAll: (projectId) => api.get('/tasks', { params: projectId ? { projectId } : {} }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  addAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Activity API
export const activityAPI = {
  getAll: () => api.get('/activities'),
};

export default api;
