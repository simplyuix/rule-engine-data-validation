const { SUPPORTED_FIELDS, SUPPORTED_OPERATORS } = require('../constants/validationConstants');
const ruleDefinitionService = require('../services/ruleDefinitionservices'); 
const validationEngine = require('../services/validationEngine');
const { pool } = require('../db');

exports.getSupportedFields = (req, res) => {
    try {
        res.status(200).json(SUPPORTED_FIELDS);
    } catch (error) {
        console.error('Error getting supported fields:', error);
        res.status(500).json({ message: 'Failed to retrieve supported fields.' });
    }
};

exports.getSupportedOperators = (req, res) => {
    try {
        res.status(200).json(SUPPORTED_OPERATORS);
    } catch (error) {
        console.error('Error getting supported operators:', error);
        res.status(500).json({ message: 'Failed to retrieve supported operators.' });
    }
};

exports.createRuleSetWithRules = async (req, res) => {
    try {
        const { name, description, createdBy, rules } = req.body;
       
        if (!name || !rules || !Array.isArray(rules)) {
            return res.status(400).json({ message: 'Rule set name and rules array are required.' });
        }

        const newRuleSet = await ruleDefinitionService.createRuleSetAndRules(
            name,
            description,
            createdBy || 'system', 
            rules
        );
        res.status(201).json(newRuleSet);
    } catch (error) {
        console.error('Error creating rule set with rules:', error);
        res.status(500).json({ message: 'Failed to create rule set', error: error.message });
    }
};

exports.getAllRuleSets = async (req, res) => {
    try {
        const ruleSets = await ruleDefinitionService.getAllRuleSets();
        res.status(200).json(ruleSets);
    } catch (error) {
        console.error('Error getting all rule sets:', error);
        res.status(500).json({ message: 'Failed to retrieve rule sets.' });
    }
};


async function getTransactions(transactionIds) {
    const client = await pool.connect();
    try {
        let query = `
            SELECT 
                t.*,
                v.vendor_name
            FROM transactions t
            LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
        `;
        let params = [];

        if (transactionIds && transactionIds.length > 0) {
            query += ` WHERE t.id = ANY($1::int[])`;
            params = [transactionIds];
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await client.query(query, params);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getTransactionsWithDateFilter(transactionIds, dateFilter) {
    const client = await pool.connect();
    try {
        let query = `
            SELECT 
                t.*,
                v.vendor_name
            FROM transactions t
            LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
            WHERE 1=1
        `;
        let params = [];
        let paramIndex = 1;

      
        if (transactionIds && transactionIds.length > 0) {
            query += ` AND t.id = ANY($${paramIndex}::int[])`;
            params.push(transactionIds);
            paramIndex++;
        }

       
        if (dateFilter) {
            const dateCondition = buildDateCondition(dateFilter, paramIndex);
            if (dateCondition.condition) {
                query += ` AND ${dateCondition.condition}`;
                params.push(...dateCondition.params);
            }
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await client.query(query, params);
        return result.rows;
    } finally {
        client.release();
    }
}

function buildDateCondition(dateFilter, startParamIndex) {
    const now = new Date();
    let condition = '';
    let params = [];

    switch (dateFilter.type) {
        case 'last_days':
            const daysAgo = new Date(now);
            daysAgo.setDate(now.getDate() - dateFilter.value);
            condition = `t.date >= $${startParamIndex}`;
            params.push(daysAgo.toISOString().split('T')[0]);
            break;

        case 'last_months':
            const monthsAgo = new Date(now);
            monthsAgo.setMonth(now.getMonth() - dateFilter.value);
            condition = `t.date >= $${startParamIndex}`;
            params.push(monthsAgo.toISOString().split('T')[0]);
            break;

        case 'current_month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            condition = `t.date >= $${startParamIndex}`;
            params.push(startOfMonth.toISOString().split('T')[0]);
            break;

        case 'current_year':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            condition = `t.date >= $${startParamIndex}`;
            params.push(startOfYear.toISOString().split('T')[0]);
            break;

        case 'date_range':
            if (dateFilter.startDate && dateFilter.endDate) {
                condition = `t.date BETWEEN $${startParamIndex} AND $${startParamIndex + 1}`;
                params.push(dateFilter.startDate, dateFilter.endDate);
            }
            break;

        case 'before_date':
            if (dateFilter.date) {
                condition = `t.date < $${startParamIndex}`;
                params.push(dateFilter.date);
            }
            break;

        case 'after_date':
            if (dateFilter.date) {
                condition = `t.date > $${startParamIndex}`;
                params.push(dateFilter.date);
            }
            break;

        default:
            break;
    }

    return { condition, params };
}

async function saveValidationResults(ruleSetId, results) {
    const client = await pool.connect();
    try {
        for (const result of results) {
            const query = `
                INSERT INTO validation_results (transaction_id, rule_set_id, is_valid, failed_rules)
                VALUES ($1, $2, $3, $4);
            `;
            await client.query(query, [
                result.transaction_id,
                ruleSetId,
                result.is_valid,
                JSON.stringify(result.failed_rules)
            ]);
        }
    } finally {
        client.release();
    }
}


exports.validateTransactions = async (req, res) => {
    try {
        const { ruleSetId, transactionIds } = req.body;

        if (!ruleSetId) {
            return res.status(400).json({ message: 'Rule set ID is required.' });
        }

        const client = await pool.connect();
        let ruleSet;
        try {
            const query = `
                SELECT 
                    rs.*,
                    json_agg(
                        json_build_object(
                            'rule_id', r.id,
                            'field_name', r.field_name,
                            'operator', r.operator,
                            'value', r.value,
                            'logical_operator', r.logical_operator,
                            'rule_order', r.rule_order
                        ) ORDER BY r.rule_order
                    ) as rules
                FROM rule_sets rs
                LEFT JOIN rules r ON rs.id = r.rule_set_id
                WHERE rs.id = $1
                GROUP BY rs.id;
            `;
            const result = await client.query(query, [ruleSetId]);
            ruleSet = result.rows[0];
        } finally {
            client.release();
        }
        
        if (!ruleSet) {
            return res.status(404).json({ message: 'Rule set not found.' });
        }

        const transactions = await getTransactions(transactionIds);
        const validationResults = validationEngine.validateTransactions(transactions, ruleSet.rules);
        await saveValidationResults(ruleSetId, validationResults);

        const summary = {
            total_transactions: validationResults.length,
            valid_count: validationResults.filter(r => r.is_valid).length,
            invalid_count: validationResults.filter(r => !r.is_valid).length,
            rule_set_name: ruleSet.name
        };

        res.status(200).json({
            summary,
            results: validationResults
        });

    } catch (error) {
        console.error('Error validating transactions:', error);
        res.status(500).json({ 
            message: 'Failed to validate transactions', 
            error: error.message 
        });
    }
};

exports.queryTransactionsByRules = async (req, res) => {
    try {
        const { ruleSetId, transactionIds, dateFilter } = req.body;

        if (!ruleSetId) {
            return res.status(400).json({ message: 'Rule set ID is required.' });
        }

        const client = await pool.connect();
        let ruleSet;
        try {
            const query = `
                SELECT 
                    rs.*,
                    json_agg(
                        json_build_object(
                            'rule_id', r.id,
                            'field_name', r.field_name,
                            'operator', r.operator,
                            'value', r.value,
                            'logical_operator', r.logical_operator,
                            'rule_order', r.rule_order
                        ) ORDER BY r.rule_order
                    ) as rules
                FROM rule_sets rs
                LEFT JOIN rules r ON rs.id = r.rule_set_id
                WHERE rs.id = $1
                GROUP BY rs.id;
            `;
            const result = await client.query(query, [ruleSetId]);
            ruleSet = result.rows[0];
        } finally {
            client.release();
        }
        
        if (!ruleSet) {
            return res.status(404).json({ message: 'Rule set not found.' });
        }

        const transactions = dateFilter ? 
            await getTransactionsWithDateFilter(transactionIds, dateFilter) :
            await getTransactions(transactionIds);

        const validationResults = validationEngine.validateTransactions(transactions, ruleSet.rules);

    
        const matchingTransactions = [];
        validationResults.forEach(result => {
            if (result.is_valid) {
                const transaction = transactions.find(t => t.id === result.transaction_id);
                if (transaction) {
                    matchingTransactions.push(transaction);
                }
            }
        });

        res.status(200).json({
            rule_set_name: ruleSet.name,
            date_filter: dateFilter ? dateFilter.type || 'custom' : 'All time',
            total_matches: matchingTransactions.length,
            total_checked: transactions.length,
            transactions: matchingTransactions
        });

    } catch (error) {
        console.error('Error querying transactions:', error);
        res.status(500).json({ 
            message: 'Failed to query transactions', 
            error: error.message 
        });
    }
};