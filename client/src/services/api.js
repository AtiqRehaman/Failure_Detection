import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      console.error('❌ API Error:', message);
      return Promise.reject(new Error(message));
    } else if (error.request) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      console.error('❌ Error:', error.message);
      return Promise.reject(new Error('An unexpected error occurred.'));
    }
  }
);

export const submitProject = async (projectData) => {
  try {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProjects = async (params = {}) => {
  try {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProject = async (id, projectData) => {
  try {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
