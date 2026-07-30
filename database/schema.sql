CREATE TABLE IF NOT EXISTS projects (
-- Create projects table
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    business_model VARCHAR(100) NOT NULL,
    target_market VARCHAR(255) NOT NULL,
    budget DECIMAL(15, 2),
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_industry ON projects(industry);

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Stores startup and project submissions for analysis';
COMMENT ON COLUMN projects.budget IS 'Project budget in USD';
COMMENT ON COLUMN projects.description IS 'Detailed project description and objectives';
