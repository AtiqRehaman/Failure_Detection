/**
 * Filter projects based on various criteria
 */
export const filterProjects = (projects, filters, searchQuery) => {
  let filtered = [...projects];

  // Apply search
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(project => 
      project.project_name?.toLowerCase().includes(query) ||
      project.industry?.toLowerCase().includes(query) ||
      project.business_model?.toLowerCase().includes(query) ||
      project.target_market?.toLowerCase().includes(query)
    );
  }

  // Apply industry filter
  if (filters.industry && filters.industry !== 'all') {
    filtered = filtered.filter(p => p.industry === filters.industry);
  }

  // Apply business model filter
  if (filters.businessModel && filters.businessModel !== 'all') {
    filtered = filtered.filter(p => p.business_model === filters.businessModel);
  }

  // Apply target market filter
  if (filters.targetMarket && filters.targetMarket !== 'all') {
    filtered = filtered.filter(p => p.target_market === filters.targetMarket);
  }

  // Apply budget range filter
  if (filters.budgetRange && filters.budgetRange !== 'all') {
    const [min, max] = filters.budgetRange;
    if (min !== undefined && max !== undefined) {
      filtered = filtered.filter(p => {
        const budget = p.budget || 0;
        return budget >= min && budget <= max;
      });
    }
  }

  // Apply date range filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (filters.dateRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '12m':
        cutoffDate.setMonth(now.getMonth() - 12);
        break;
      default:
        cutoffDate = null;
    }
    
    if (cutoffDate) {
      filtered = filtered.filter(p => new Date(p.created_at) >= cutoffDate);
    }
  }

  return filtered;
};

/**
 * Get unique values from projects for filter options
 */
export const getFilterOptions = (projects) => {
  const industries = [...new Set(projects.map(p => p.industry).filter(Boolean))];
  const businessModels = [...new Set(projects.map(p => p.business_model).filter(Boolean))];
  const targetMarkets = [...new Set(projects.map(p => p.target_market).filter(Boolean))];
  
  return {
    industries: industries.sort(),
    businessModels: businessModels.sort(),
    targetMarkets: targetMarkets.sort()
  };
};

/**
 * Calculate dashboard statistics
 */
export const calculateStats = (projects) => {
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const avgBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;
  const industries = new Set(projects.map(p => p.industry));
  const businessModels = new Set(projects.map(p => p.business_model));
  
  return {
    totalProjects,
    totalBudget,
    avgBudget,
    industryCount: industries.size,
    businessModelCount: businessModels.size
  };
};

/**
 * Get monthly growth data
 */
export const getMonthlyGrowth = (projects) => {
  const grouped = {};
  
  projects.forEach(p => {
    const date = new Date(p.created_at);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const monthIndex = date.getFullYear() * 12 + date.getMonth();
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: monthKey,
        count: 0,
        monthIndex,
        year: date.getFullYear(),
        monthNum: date.getMonth()
      };
    }
    grouped[monthKey].count++;
  });

  const data = Object.values(grouped)
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .map((item, index, arr) => {
      const prevCount = index > 0 ? arr[index - 1].count : item.count;
      const growth = prevCount > 0 ? ((item.count - prevCount) / prevCount) * 100 : 0;
      return {
        month: item.month,
        count: item.count,
        growth: Math.round(growth * 10) / 10,
        growthColor: growth >= 0 ? '#10b981' : '#ef4444'
      };
    });

  return data;
};

/**
 * Get target market distribution
 */
export const getTargetMarketDistribution = (projects) => {
  const distribution = {};
  
  projects.forEach(p => {
    const market = p.target_market || 'Other';
    distribution[market] = (distribution[market] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Get business model distribution
 */
export const getBusinessModelDistribution = (projects) => {
  const distribution = {};
  
  projects.forEach(p => {
    const model = p.business_model || 'Other';
    distribution[model] = (distribution[model] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Get project status (mock for now)
 */
export const getProjectStatus = (project) => {
  // Use created_at to determine status
  const date = new Date(project.created_at);
  const now = new Date();
  const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
  
  if (daysDiff < 7) return 'Submitted';
  if (daysDiff < 14) return 'Processing';
  return 'Completed';
};

/**
 * Get trend analysis with mock data
 */
export const getTrendData = (industry = 'all', timeRange = '12m') => {
  // This is mock data for the Google Trends panel
  const allData = {
    'All Industries': {
      trendScore: 84,
      status: 'Rising',
      trendingTopics: ['AI Agents', 'Computer Vision', 'Healthcare AI', 'Sustainability', 'Blockchain'],
      relatedQueries: ['Startup AI', 'Machine Learning', 'LLM', 'Data Science', 'Cloud Computing'],
      risingSearches: [
        { term: 'AI Agents', growth: 320 },
        { term: 'GPT Applications', growth: 150 },
        { term: 'Computer Vision', growth: 90 },
        { term: 'Edge Computing', growth: 75 },
        { term: 'Quantum Computing', growth: 60 }
      ],
      insight: 'Artificial Intelligence startups are steadily increasing over the past month, with a significant focus on AI Agents and Computer Vision applications.'
    },
    'Technology': {
      trendScore: 92,
      status: 'Rising',
      trendingTopics: ['AI Agents', 'Computer Vision', 'Edge AI', 'Quantum Computing', 'Web3'],
      relatedQueries: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI Ethics'],
      risingSearches: [
        { term: 'AI Agents', growth: 380 },
        { term: 'GPT Applications', growth: 200 },
        { term: 'Computer Vision', growth: 120 },
        { term: 'Edge Computing', growth: 95 },
        { term: 'Quantum Computing', growth: 80 }
      ],
      insight: 'Technology sector shows strong growth in AI and quantum computing, with AI Agents leading the trend.'
    },
    'Healthcare': {
      trendScore: 78,
      status: 'Stable',
      trendingTopics: ['Healthcare AI', 'Digital Health', 'Telemedicine', 'Health Analytics', 'Biotech'],
      relatedQueries: ['Health Tech', 'Digital Health', 'Telemedicine', 'Healthcare AI', 'Biotech'],
      risingSearches: [
        { term: 'Healthcare AI', growth: 180 },
        { term: 'Telemedicine', growth: 120 },
        { term: 'Digital Health', growth: 100 },
        { term: 'Health Analytics', growth: 70 },
        { term: 'Biotech', growth: 50 }
      ],
      insight: 'Healthcare sector shows steady growth in digital health and telemedicine solutions.'
    },
    'Finance': {
      trendScore: 71,
      status: 'Stable',
      trendingTopics: ['FinTech', 'Digital Banking', 'Blockchain', 'AI Trading', 'InsurTech'],
      relatedQueries: ['FinTech', 'Blockchain', 'Digital Banking', 'InsurTech', 'AI Trading'],
      risingSearches: [
        { term: 'FinTech', growth: 150 },
        { term: 'Blockchain', growth: 110 },
        { term: 'Digital Banking', growth: 85 },
        { term: 'InsurTech', growth: 65 },
        { term: 'AI Trading', growth: 45 }
      ],
      insight: 'FinTech continues to evolve with blockchain and AI trading gaining significant traction.'
    },
    'Education': {
      trendScore: 65,
      status: 'Stable',
      trendingTopics: ['EdTech', 'Online Learning', 'Virtual Classrooms', 'Gamification', 'AI Tutors'],
      relatedQueries: ['EdTech', 'Online Learning', 'Virtual Education', 'AI Tutors', 'Gamification'],
      risingSearches: [
        { term: 'EdTech', growth: 130 },
        { term: 'Online Learning', growth: 100 },
        { term: 'Virtual Classrooms', growth: 75 },
        { term: 'AI Tutors', growth: 55 },
        { term: 'Gamification', growth: 40 }
      ],
      insight: 'EdTech shows consistent growth with increased focus on online learning and virtual classrooms.'
    }
  };

  // Default to 'All Industries' if industry not found
  return allData[industry] || allData['All Industries'];
};