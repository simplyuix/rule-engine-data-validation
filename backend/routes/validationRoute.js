const express = require('express');
const router = express.Router();
const validationController = require('../constrollers/validationController');


router.get('/supported-fields', validationController.getSupportedFields);
router.get('/supported-operators', validationController.getSupportedOperators);

router.post('/query', validationController.queryTransactionsByRules);

router.post('/rule-sets', validationController.createRuleSetWithRules);
router.get('/rule-sets', validationController.getAllRuleSets);


router.post('/validate', validationController.validateTransactions);

module.exports = router;