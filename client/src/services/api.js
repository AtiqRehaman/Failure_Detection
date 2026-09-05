import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ===================================================
// REQUEST INTERCEPTOR - Add Auth Token
// ===================================================
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ===================================================
// RESPONSE INTERCEPTOR - Handle Token Expiry
// ===================================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (Token expired or invalid)
    if (error.response?.status === 401) {
      console.error("❌ Authentication error. Redirecting to login...");
      // Clear stored tokens
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login page
      window.location.href = "/login";
    }

    if (error.response) {
      const message = error.response.data?.message || "An error occurred";
      console.error("❌ API Error:", message);
      return Promise.reject(new Error(message));
    } else if (error.request) {
      console.error("❌ Network Error:", error.message);
      return Promise.reject(
        new Error("Network error. Please check your connection."),
      );
    } else {
      console.error("❌ Error:", error.message);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  },
);

// ===================================================
// NORMALIZATION FUNCTIONS
// ===================================================
const normalizeProject = (project) => {
  if (!project || typeof project !== "object") return project;
  return {
    ...project,
    id: project.project_id ?? project.id,
  };
};

const normalizeApiResponse = (responseData) => {
  if (!responseData || typeof responseData !== "object") return responseData;

  if (Array.isArray(responseData.data)) {
    return {
      ...responseData,
      data: responseData.data.map(normalizeProject),
    };
  }

  if (responseData.data && typeof responseData.data === "object") {
    return {
      ...responseData,
      data: normalizeProject(responseData.data),
    };
  }

  return responseData;
};

// ===================================================
// AUTHENTICATION FUNCTIONS
// ===================================================

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register user
export const registerUser = async (name, email, password) => {
  try {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout user (clear local storage)
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

// ===================================================
// PROJECT FUNCTIONS
// ===================================================

// Submit a new project
export const submitProject = async (projectData) => {
  try {
    const response = await apiClient.post("/projects", projectData);
    return normalizeApiResponse(response.data);
  } catch (error) {
    throw error;
  }
};

// Get all projects with pagination
export const getProjects = async (params = {}) => {
  try {
    const response = await apiClient.get("/projects", { params });
    return normalizeApiResponse(response.data);
  } catch (error) {
    throw error;
  }
};

// Get a single project by ID
export const getProjectById = async (id) => {
  try {
    const response = await apiClient.get(`/projects/${id}`);
    return normalizeApiResponse(response.data);
  } catch (error) {
    throw error;
  }
};

// Update a project
export const updateProject = async (id, projectData) => {
  try {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id) => {
  try {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================================================
// ASSESSMENT FUNCTIONS (Milestone 2)
// ===================================================

// Generate assessment for a project
export const generateAssessment = async (projectId) => {
  try {
    const response = await apiClient.post(`/assessment/${projectId}/generate`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get assessment for a project
export const getAssessment = async (projectId) => {
  try {
    const response = await apiClient.get(`/assessment/${projectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================================================
// MARKET INTELLIGENCE (Mock)
// ===================================================

export const getMarketIntelligence = async (
  industry,
  projectName,
  targetMarket,
) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    marketSaturationIndex: 68, // Out of 100
    competitorCount: 14,
    fundingTrend: "+18.4%", // Year over Year
    keyCompetitors: [
      { name: "EcoNexus Tech", funding: "₹2.5 Cr", marketShare: "32%" },
      { name: "GreenGrid Labs", funding: "₹1.1 Cr", marketShare: "21%" },
      { name: "PureEarth Innovations", funding: "₹85 L", marketShare: "14%" },
    ],
    marketOpportunityGap:
      "High demand in Tier-2/Tier-3 regional markets with low localized competition.",
    trendingKeywords: [
      "Sustainability",
      "CleanTech",
      "Carbon Offset",
      "ESG Compliance",
    ],
  };
};

// ===================================================
// DEFAULT EXPORT
// ===================================================

export default apiClient;
