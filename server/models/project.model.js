const { pool } = require('../config/database');

class ProjectModel {
    static async create(projectData) {
        const {
            user_id,
            project_name,
            industry,
            business_model,
            target_market_size,  // Changed from target_market
            budget,
            employees_count,
            founder_experience_years,
            description
        } = projectData;

        const query = `
            INSERT INTO projects (
                user_id,
                project_name,
                industry,
                business_model,
                target_market_size,
                budget,
                employees_count,
                founder_experience_years,
                description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING project_id, user_id, project_name, industry, business_model, 
                      target_market_size, budget, employees_count, founder_experience_years, 
                      description, created_at
        `;

        const values = [
            user_id,
            project_name,
            industry,
            business_model,
            target_market_size || 'Medium',
            budget || null,
            employees_count || 1,
            founder_experience_years || 0,
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
        
        const query = `
            SELECT project_id, user_id, project_name, industry, business_model, 
                   target_market_size, budget, employees_count, founder_experience_years,
                   description, created_at
            FROM projects
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;

        try {
            const result = await pool.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw new Error('Failed to fetch projects');
        }
    }

    static async findById(id) {
        const query = `
            SELECT project_id, user_id, project_name, industry, business_model, 
                   target_market_size, budget, employees_count, founder_experience_years,
                   description, created_at
            FROM projects
            WHERE project_id = $1
        `;

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
            target_market_size,
            budget,
            employees_count,
            founder_experience_years,
            description
        } = updateData;

        const query = `
            UPDATE projects
            SET 
                project_name = COALESCE($1, project_name),
                industry = COALESCE($2, industry),
                business_model = COALESCE($3, business_model),
                target_market_size = COALESCE($4, target_market_size),
                budget = COALESCE($5, budget),
                employees_count = COALESCE($6, employees_count),
                founder_experience_years = COALESCE($7, founder_experience_years),
                description = COALESCE($8, description),
                updated_at = CURRENT_TIMESTAMP
            WHERE project_id = $9
            RETURNING project_id, user_id, project_name, industry, business_model, 
                      target_market_size, budget, employees_count, founder_experience_years,
                      description, created_at
        `;

        const values = [
            project_name,
            industry,
            business_model,
            target_market_size,
            budget,
            employees_count,
            founder_experience_years,
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
        const query = 'DELETE FROM projects WHERE project_id = $1 RETURNING project_id';

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
        const query = `
            SELECT industry, COUNT(*) as count
            FROM projects
            GROUP BY industry
            ORDER BY count DESC
        `;

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting industry stats:', error);
            throw new Error('Failed to get industry statistics');
        }
    }

    // Get projects by user ID
    static async findByUserId(userId, options = {}) {
        const { limit = 100, offset = 0 } = options;
        
        const query = `
            SELECT project_id, user_id, project_name, industry, business_model, 
                   target_market_size, budget, employees_count, founder_experience_years,
                   description, created_at
            FROM projects
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        try {
            const result = await pool.query(query, [userId, limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching user projects:', error);
            throw new Error('Failed to fetch user projects');
        }
    }
}

module.exports = ProjectModel;