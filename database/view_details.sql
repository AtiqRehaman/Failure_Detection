-- Count the projects
SELECT COUNT(*) as total_projects FROM projects;

-- View all projects (limited for display)
SELECT id, project_name, industry, business_model, target_market, budget, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- View industry distribution
SELECT industry, COUNT(*) as count 
FROM projects 
GROUP BY industry 
ORDER BY count DESC;

-- View budget statistics
SELECT 
    COUNT(*) as total_projects,
    AVG(budget) as average_budget,
    MIN(budget) as min_budget,
    MAX(budget) as max_budget,
    SUM(budget) as total_budget
FROM projects;
