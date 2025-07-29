
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

class RuleService {
 
    async createRuleSet(name, description, createdBy, rules) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

         
            const ruleSetQuery = `
                INSERT INTO rule_sets (name, description, created_by)
                VALUES ($1, $2, $3) RETURNING *;
            `;
            const ruleSetResult = await client.query(ruleSetQuery, [name, description, createdBy]);
            const ruleSet = ruleSetResult.rows[0];

        
            const savedRules = [];
            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                const ruleQuery = `
                    INSERT INTO rules (rule_set_id, field_name, operator, value, data_type, logical_operator, rule_order)
                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
                `;
                const ruleResult = await client.query(ruleQuery, [
                    ruleSet.id,
                    rule.field_name,
                    rule.operator,
                    rule.value,
                    rule.data_type,
                    rule.logical_operator,
                    rule.rule_order || (i + 1)
                ]);
                savedRules.push(ruleResult.rows[0]);
            }

            await client.query('COMMIT');
            return { ...ruleSet, rules: savedRules };
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
            const query = `
                SELECT 
                    rs.*,
                    json_agg(
                        json_build_object(
                            'id', r.id,
                            'field_name', r.field_name,
                            'operator', r.operator,
                            'value', r.value,
                            'data_type', r.data_type,
                            'logical_operator', r.logical_operator,
                            'rule_order', r.rule_order
                        ) ORDER BY r.rule_order
                    ) as rules
                FROM rule_sets rs
                LEFT JOIN rules r ON rs.id = r.rule_set_id
                WHERE rs.is_active = true
                GROUP BY rs.id
                ORDER BY rs.created_at DESC;
            `;
            const result = await client.query(query);
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
                            'id', r.id,
                            'field_name', r.field_name,
                            'operator', r.operator,
                            'value', r.value,
                            'data_type', r.data_type,
                            'logical_operator', r.logical_operator,
                            'rule_order', r.rule_order
                        ) ORDER BY r.rule_order
                    ) as rules
                FROM rule_sets rs
                LEFT JOIN rules r ON rs.id = r.rule_set_id
                WHERE rs.id = $1 AND rs.is_active = true
                GROUP BY rs.id;
            `;
            const result = await client.query(query, [ruleSetId]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }
}

module.exports = new RuleService();