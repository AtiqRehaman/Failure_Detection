#!/bin/bash

# Script to add Dashboard page and update Navbar for AI-Powered Product Intelligence System

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Adding Dashboard & Navbar Updates${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the project root
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo -e "${RED}❌ Error: Must run this script from the project root directory${NC}"
    echo -e "${YELLOW}Please navigate to your project root and run again${NC}"
    exit 1
fi

# Function to create or update file
update_file() {
    local file_path="$1"
    local content="$2"
    mkdir -p "$(dirname "$file_path")"
    echo "$content" > "$file_path"
    echo -e "${GREEN}✅ Updated/Created: $file_path${NC}"
}

echo -e "${YELLOW}📦 Installing new dependencies...${NC}"
cd client
npm install recharts react-icons
cd ..

echo -e "${YELLOW}📝 Updating files...${NC}"

# Update server/models/project.model.js - Add getIndustryStats method
update_file "server/models/project.model.js" \
"const { pool } = require('../config/database');

class ProjectModel {
    static async create(projectData) {
        const {
            project_name,
            industry,
            business_model,
            target_market,
            budget,
            description
        } = projectData;

        const query = \`
            INSERT INTO projects (
                project_name,
                industry,
                business_model,
                target_market,
                budget,
                description
            ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
            RETURNING id, project_name, industry, business_model, 
                      target_market, budget, description, created_at
        \`;

        const values = [
            project_name,
            industry,
            business_model,
            target_market,
            budget || null,
            description
        ];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating project:', error);
            throw new Error('Failed to create project');
        }
    }

    static async findAll(options = {}) {
        const { limit = 100, offset = 0 } = options;
        
        const query = \`
            SELECT id, project_name, industry, business_model, 
                   target_market, budget, description, created_at
            FROM projects
            ORDER BY created_at DESC
            LIMIT \$1 OFFSET \$2
        \`;

        try {
            const result = await pool.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw new Error('Failed to fetch projects');
        }
    }

    static async findById(id) {
        const query = \`
            SELECT id, project_name, industry, business_model, 
                   target_market, budget, description, created_at
            FROM projects
            WHERE id = \$1
        \`;

        try {
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error fetching project:', error);
            throw new Error('Failed to fetch project');
        }
    }

    static async update(id, updateData) {
        const {
            project_name,
            industry,
            business_model,
            target_market,
            budget,
            description
        } = updateData;

        const query = \`
            UPDATE projects
            SET 
                project_name = COALESCE(\$1, project_name),
                industry = COALESCE(\$2, industry),
                business_model = COALESCE(\$3, business_model),
                target_market = COALESCE(\$4, target_market),
                budget = COALESCE(\$5, budget),
                description = COALESCE(\$6, description)
            WHERE id = \$7
            RETURNING id, project_name, industry, business_model, 
                      target_market, budget, description, created_at
        \`;

        const values = [
            project_name,
            industry,
            business_model,
            target_market,
            budget,
            description,
            id
        ];

        try {
            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating project:', error);
            throw new Error('Failed to update project');
        }
    }

    static async delete(id) {
        const query = 'DELETE FROM projects WHERE id = \$1 RETURNING id';

        try {
            const result = await pool.query(query, [id]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw new Error('Failed to delete project');
        }
    }

    static async count() {
        const query = 'SELECT COUNT(*) as count FROM projects';

        try {
            const result = await pool.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting projects:', error);
            throw new Error('Failed to count projects');
        }
    }

    static async getIndustryStats() {
        const query = \`
            SELECT industry, COUNT(*) as count
            FROM projects
            GROUP BY industry
            ORDER BY count DESC
        \`;

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting industry stats:', error);
            throw new Error('Failed to get industry statistics');
        }
    }
}

module.exports = ProjectModel;"

# Update server/controllers/project.controller.js - Add dashboard stats endpoint
update_file "server/controllers/project.controller.js" \
"const { ProjectModel } = require('../models');

class ProjectController {
    async createProject(req, res, next) {
        try {
            const projectData = {
                project_name: req.body.projectName,
                industry: req.body.industry,
                business_model: req.body.businessModel,
                target_market: req.body.targetMarket,
                budget: req.body.budget,
                description: req.body.description
            };

            const project = await ProjectModel.create(projectData);

            res.status(201).json({
                status: 'success',
                message: 'Project created successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjects(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            const projects = await ProjectModel.findAll({ limit, offset });
            const total = await ProjectModel.count();
            const industryStats = await ProjectModel.getIndustryStats();

            res.status(200).json({
                status: 'success',
                data: projects,
                pagination: {
                    total,
                    limit,
                    offset,
                    pages: Math.ceil(total / limit)
                },
                stats: {
                    totalProjects: total,
                    industryDistribution: industryStats
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProject(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid project ID'
                });
            }

            const project = await ProjectModel.findById(id);

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.status(200).json({
                status: 'success',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProject(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid project ID'
                });
            }

            const updateData = {
                project_name: req.body.projectName,
                industry: req.body.industry,
                business_model: req.body.businessModel,
                target_market: req.body.targetMarket,
                budget: req.body.budget,
                description: req.body.description
            };

            const project = await ProjectModel.update(id, updateData);

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.status(200).json({
                status: 'success',
                message: 'Project updated successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProject(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid project ID'
                });
            }

            const deleted = await ProjectModel.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.status(200).json({
                status: 'success',
                message: 'Project deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getDashboardStats(req, res, next) {
        try {
            const total = await ProjectModel.count();
            const industryStats = await ProjectModel.getIndustryStats();
            const recentProjects = await ProjectModel.findAll({ limit: 5 });

            res.status(200).json({
                status: 'success',
                data: {
                    totalProjects: total,
                    industryDistribution: industryStats,
                    recentProjects: recentProjects
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProjectController();"

# Update server/routes/project.routes.js - Add dashboard stats route
update_file "server/routes/project.routes.js" \
"const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { validateProject, handleValidationErrors } = require('../utils/validators');
const { validateRequestBody } = require('../middleware/validation');

router.post(
    '/',
    validateRequestBody,
    validateProject,
    handleValidationErrors,
    projectController.createProject
);

router.get('/', projectController.getProjects);
router.get('/dashboard/stats', projectController.getDashboardStats);
router.get('/:id', projectController.getProject);

router.put(
    '/:id',
    validateRequestBody,
    validateProject,
    handleValidationErrors,
    projectController.updateProject
);

router.delete('/:id', projectController.deleteProject);

module.exports = router;"

# Update Navbar
update_file "client/src/components/Navbar.jsx" \
"import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50';
  };

  return (
    <nav className=\"bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center h-16\">
          <div className=\"flex items-center space-x-3\">
            <div className=\"flex-shrink-0\">
              <div className=\"w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md\">
                <svg className=\"w-5 h-5 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 10V3L4 14h7v7l9-11h-7z\" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className=\"text-xl font-bold text-gray-900 tracking-tight\">
                Product<span className=\"text-primary-600\">Intel</span>
              </h1>
              <p className=\"text-xs text-gray-500 -mt-0.5\">AI-Powered Intelligence</p>
            </div>
          </div>
          
          <div className=\"flex items-center space-x-2\">
            <Link
              to=\"/dashboard\"
              className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 \${isActive('/dashboard')}\`}
            >
              <div className=\"flex items-center space-x-2\">
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z\" />
                </svg>
                <span>Dashboard</span>
              </div>
            </Link>
            <Link
              to=\"/submit\"
              className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 \${isActive('/submit')}\`}
            >
              <div className=\"flex items-center space-x-2\">
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4v16m8-8H4\" />
                </svg>
                <span>Project Input</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;"

# Create Dashboard page
update_file "client/src/pages/Dashboard.jsx" \
"import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { getProjects } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { FaProjectDiagram, FaIndustry, FaUsers, FaDollarSign } from 'react-icons/fa';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    industryDistribution: [],
    recentProjects: []
  });
  const [toast, setToast] = useState(null);

  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8', '#1e40af', '#dbeafe', '#bfdbfe'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      const { data, stats: dashboardStats } = response;
      
      setProjects(data || []);
      setStats({
        totalProjects: dashboardStats?.totalProjects || 0,
        industryDistribution: dashboardStats?.industryDistribution || [],
        recentProjects: data?.slice(0, 5) || []
      });
    } catch (error) {
      setToast({
        message: 'Failed to load dashboard data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate additional stats
  const calculateAdditionalStats = () => {
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const industries = new Set(projects.map(p => p.industry));
    const businessModels = new Set(projects.map(p => p.business_model));
    
    return {
      totalBudget: totalBudget,
      industryCount: industries.size,
      businessModelCount: businessModels.size,
      averageBudget: projects.length > 0 ? totalBudget / projects.length : 0
    };
  };

  const additionalStats = calculateAdditionalStats();

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `\$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `\$${(amount / 1000).toFixed(1)}K`;
    }
    return `\$${amount}`;
  };

  // Get budget data for chart
  const getBudgetData = () => {
    return projects.slice(0, 10).map(p => ({
      name: p.project_name.length > 20 ? p.project_name.substring(0, 20) + '...' : p.project_name,
      budget: p.budget || 0
    }));
  };

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <LoadingSpinner size=\"lg\" />
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-7xl mx-auto\">
        {/* Header */}
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-gray-900 tracking-tight\">
            Dashboard
          </h1>
          <p className=\"mt-2 text-gray-600\">
            Overview of all projects and market intelligence insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8\">
          <div className=\"stat-card\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"stat-label\">Total Projects</p>
                <p className=\"stat-number\">{stats.totalProjects}</p>
              </div>
              <div className=\"w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600\">
                <FaProjectDiagram size={24} />
              </div>
            </div>
          </div>

          <div className=\"stat-card\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"stat-label\">Industries</p>
                <p className=\"stat-number\">{additionalStats.industryCount}</p>
              </div>
              <div className=\"w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600\">
                <FaIndustry size={24} />
              </div>
            </div>
          </div>

          <div className=\"stat-card\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"stat-label\">Business Models</p>
                <p className=\"stat-number\">{additionalStats.businessModelCount}</p>
              </div>
              <div className=\"w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600\">
                <FaUsers size={24} />
              </div>
            </div>
          </div>

          <div className=\"stat-card\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"stat-label\">Total Budget</p>
                <p className=\"stat-number\">{formatCurrency(additionalStats.totalBudget)}</p>
              </div>
              <div className=\"w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600\">
                <FaDollarSign size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8\">
          {/* Industry Distribution - Pie Chart */}
          <div className=\"card p-6\">
            <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Industry Distribution</h3>
            <div className=\"h-72\">
              <ResponsiveContainer width=\"100%\" height=\"100%\">
                <PieChart>
                  <Pie
                    data={stats.industryDistribution}
                    dataKey=\"count\"
                    nameKey=\"industry\"
                    cx=\"50%\"
                    cy=\"50%\"
                    outerRadius={80}
                    label={(entry) => entry.industry}
                  >
                    {stats.industryDistribution.map((entry, index) => (
                      <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Distribution - Bar Chart */}
          <div className=\"card p-6\">
            <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Budget Distribution (Top 10)</h3>
            <div className=\"h-72\">
              <ResponsiveContainer width=\"100%\" height=\"100%\">
                <BarChart data={getBudgetData()}>
                  <CartesianGrid strokeDasharray=\"3 3\" />
                  <XAxis dataKey=\"name\" angle={-45} textAnchor=\"end\" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey=\"budget\" fill=\"#3b82f6\" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className=\"card p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Recent Projects</h3>
          {stats.recentProjects.length > 0 ? (
            <div className=\"overflow-x-auto\">
              <table className=\"w-full\">
                <thead>
                  <tr className=\"border-b border-gray-200\">
                    <th className=\"text-left py-3 px-4 text-sm font-medium text-gray-600\">Project Name</th>
                    <th className=\"text-left py-3 px-4 text-sm font-medium text-gray-600\">Industry</th>
                    <th className=\"text-left py-3 px-4 text-sm font-medium text-gray-600\">Business Model</th>
                    <th className=\"text-left py-3 px-4 text-sm font-medium text-gray-600\">Budget</th>
                    <th className=\"text-left py-3 px-4 text-sm font-medium text-gray-600\">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentProjects.map((project, index) => (
                    <tr key={project.id} className={\`\${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors duration-200\`}>
                      <td className=\"py-3 px-4 text-sm text-gray-900\">{project.project_name}</td>
                      <td className=\"py-3 px-4 text-sm text-gray-600\">
                        <span className=\"px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium\">
                          {project.industry}
                        </span>
                      </td>
                      <td className=\"py-3 px-4 text-sm text-gray-600\">{project.business_model}</td>
                      <td className=\"py-3 px-4 text-sm text-gray-600\">
                        {project.budget ? formatCurrency(project.budget) : 'N/A'}
                      </td>
                      <td className=\"py-3 px-4 text-sm text-gray-600\">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className=\"text-center py-12\">
              <p className=\"text-gray-500\">No projects submitted yet</p>
              <p className=\"text-sm text-gray-400 mt-2\">Submit your first project to see analytics here</p>
            </div>
          )}
        </div>

        {/* Market Intelligence Section */}
        <div className=\"mt-8 card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200\">
          <div className=\"flex items-start space-x-4\">
            <div className=\"flex-shrink-0\">
              <div className=\"w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center\">
                <svg className=\"w-6 h-6 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 10V3L4 14h7v7l9-11h-7z\" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className=\"text-lg font-semibold text-gray-900\">Market Intelligence Coming Soon</h3>
              <p className=\"text-gray-600 mt-1\">
                AI-powered market analysis, competitor insights, and strategic recommendations will be available in future updates.
              </p>
              <div className=\"mt-3 flex flex-wrap gap-2\">
                <span className=\"px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium\">
                  AI Analysis
                </span>
                <span className=\"px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium\">
                  Competitor Tracking
                </span>
                <span className=\"px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium\">
                  Market Trends
                </span>
                <span className=\"px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium\">
                  Risk Assessment
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;"

# Update App.jsx to include Dashboard route
update_file "client/src/App.jsx" \
"import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProjectSubmission from './pages/ProjectSubmission';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className=\"min-h-screen bg-gray-50\">
        <Navbar />
        <Routes>
          <Route path=\"/\" element={<Dashboard />} />
          <Route path=\"/submit\" element={<ProjectSubmission />} />
          <Route path=\"/dashboard\" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;"

# Update App.css with stat card styles
update_file "client/src/App.css" \
"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply box-border;
  }
  
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg border border-gray-300 transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-1.5;
  }
  
  .form-input {
    @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900;
  }
  
  .form-input-error {
    @apply border-red-500 focus:ring-red-500;
  }
  
  .form-error-text {
    @apply text-sm text-red-600 mt-1.5;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-soft border border-gray-100;
  }
  
  .card-hover {
    @apply hover:shadow-soft-lg transition-shadow duration-300;
  }
  
  .stat-card {
    @apply bg-white rounded-xl shadow-soft border border-gray-100 p-6 transition-all duration-200 hover:shadow-soft-lg;
  }
  
  .stat-number {
    @apply text-3xl font-bold text-gray-900;
  }
  
  .stat-label {
    @apply text-sm font-medium text-gray-600;
  }
}"

# Done
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Dashboard & Navbar Added Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📦 New dependencies installed:${NC}"
echo -e "  • recharts - For charts and graphs"
echo -e "  • react-icons - For icons"
echo ""
echo -e "${BLUE}📋 What was added:${NC}"
echo -e "  1. 📊 Dashboard page with statistics and charts"
echo -e "  2. 🧭 Updated Navbar with Dashboard link"
echo -e "  3. 📈 Industry distribution pie chart"
echo -e "  4. 💰 Budget bar chart"
echo -e "  5. 📋 Recent projects table"
echo -e "  6. 🔄 New API endpoint for dashboard stats"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "  1. Restart your backend: cd server && npm run dev"
echo -e "  2. Restart your frontend: cd client && npm run dev"
echo -e "  3. Visit: http://localhost:5173/dashboard"
echo ""
echo -e "${GREEN}🎉 Dashboard is ready to use!${NC}"