const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid'); 

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

class RuleDefinitionService {
   async createRuleSetAndRules(name, description, createdBy, rulesData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

       
        const ruleSetInsertQuery = `
            INSERT INTO rule_sets (name, description, created_by)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const ruleSetResult = await client.query(
            ruleSetInsertQuery,
            [name, description, createdBy]
        );
        const newRuleSet = ruleSetResult.rows[0];

        const savedRules = [];
        for (let i = 0; i < rulesData.length; i++) {
            const rule = rulesData[i];
            const ruleInsertQuery = `
                INSERT INTO rules (rule_set_id, field_name, operator, value, data_type, logical_operator, rule_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
            `;
            const ruleResult = await client.query(
                ruleInsertQuery,
                [newRuleSet.id, rule.fieldName, rule.operator, rule.value, 'text', rule.logicalOperator, rule.order || (i + 1)]
            );
            savedRules.push(ruleResult.rows[0]);
        }

        await client.query('COMMIT');
        return { rule_set_id: newRuleSet.id, ...newRuleSet, rules: savedRules };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

   async getAllRuleSets() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM rule_sets WHERE is_active = true;');
        return result.rows;
    } finally {
        client.release();
    }
}
   
async getRuleSetById(ruleSetId) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                rs.*,
                json_agg(
                    json_build_object(
                        'rule_id', r.rule_id,
                        'field_name', r.field_name,
                        'operator', r.operator,
                        'value', r.value,
                        'logical_operator', r.logical_operator,
                        'rule_order', r.rule_order
                    ) ORDER BY r.rule_order
                ) as rules
            FROM ValidationRuleSet rs
            LEFT JOIN ValidationRule r ON rs.rule_set_id = r.rule_set_id
            WHERE rs.rule_set_id = $1
            GROUP BY rs.rule_set_id;
        `;
        const result = await client.query(query, [ruleSetId]);
        return result.rows[0];
    } finally {
        client.release();
    }
}
}


module.exports = new RuleDefinitionService();
