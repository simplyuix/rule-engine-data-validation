const express = require('express');
const router = express.Router();
const ruleController = require('../constrollers/ruleController');


router.get('/supported-fields', ruleController.getSupportedFields);
router.get('/supported-operators', ruleController.getSupportedOperators);


router.post('/rule-sets', ruleController.createRuleSetWithRules);


router.get('/rule-sets', ruleController.getAllRuleSets);

module.exports = router;
