const { pool } = require("../config/database");

class ProjectModel {
  static async create(projectData) {
        const {
            user_id,
            project_name,
            industry,
            business_model,
            target_market,
            budget,
            description
        } = projectData;

        const query = `
            INSERT INTO projects (
                user_id,
                project_name,
                industry,
                business_model,
                target_market,
                budget,
                description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING project_id, user_id, project_name, industry, business_model, 
                      target_market, budget, description, created_at
        `;

        const values = [
            user_id,
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

    const query = `
            SELECT project_id, project_name, industry, business_model, 
                   target_market, budget, description, created_at
            FROM projects
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;

    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw new Error("Failed to fetch projects");
    }
  }

  static async findById(id) {
    const query = `
            SELECT project_id, project_name, industry, business_model, 
                   target_market, budget, description, created_at
            FROM projects
            WHERE project_id = $1
        `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw new Error("Failed to fetch project");
    }
  }

  static async update(id, updateData) {
    const {
      project_name,
      industry,
      business_model,
      target_market,
      budget,
      description,
    } = updateData;

    const query = `
            UPDATE projects
            SET 
                project_name = COALESCE($1, project_name),
                industry = COALESCE($2, industry),
                business_model = COALESCE($3, business_model),
                target_market = COALESCE($4, target_market),
                budget = COALESCE($5, budget),
                description = COALESCE($6, description)
            WHERE project_id = $7
            RETURNING project_id, project_name, industry, business_model, 
                      target_market, budget, description, created_at
        `;

    const values = [
      project_name,
      industry,
      business_model,
      target_market,
      budget,
      description,
      id,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating project:", error);
      throw new Error("Failed to update project");
    }
  }

  static async delete(id) {
    const query =
      "DELETE FROM projects WHERE project_id = $1 RETURNING project_id";

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw new Error("Failed to delete project");
    }
  }

  static async count() {
    const query = "SELECT COUNT(*) as count FROM projects";

    try {
      const result = await pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("Error counting projects:", error);
      throw new Error("Failed to count projects");
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
      console.error("Error getting industry stats:", error);
      throw new Error("Failed to get industry statistics");
    }
  }
}

module.exports = ProjectModel;
