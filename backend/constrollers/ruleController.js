const { SUPPORTED_FIELDS, SUPPORTED_OPERATORS } = require('../constants/validationConstants');
const ruleDefinitionService = require('../services/ruleDefinitionservices'); 


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
