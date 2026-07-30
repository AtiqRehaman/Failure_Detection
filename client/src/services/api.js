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

// Fetch market intelligence for a specific industry & project
export const getMarketIntelligence = async (industry, projectName, targetMarket) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    marketSaturationIndex: 68, // Out of 100
    competitorCount: 14,
    fundingTrend: "+18.4%", // Year over Year
    keyCompetitors: [
      { name: "EcoNexus Tech", funding: "₹2.5 Cr", marketShare: "32%" },
      { name: "GreenGrid Labs", funding: "₹1.1 Cr", marketShare: "21%" },
      { name: "PureEarth Innovations", funding: "₹85 L", marketShare: "14%" }
    ],
    marketOpportunityGap: "High demand in Tier-2/Tier-3 regional markets with low localized competition.",
    trendingKeywords: ["Sustainability", "CleanTech", "Carbon Offset", "ESG Compliance"]
  };
};

export default apiClient;
