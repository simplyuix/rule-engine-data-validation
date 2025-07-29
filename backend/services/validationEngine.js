class ValidationEngine {
    constructor() {
      
        this.operators = {
            '>': (actual, expected) => Number(actual) > Number(expected),
            '<': (actual, expected) => Number(actual) < Number(expected),
            '=': (actual, expected) => String(actual) === String(expected),
            '>=': (actual, expected) => Number(actual) >= Number(expected),
            '<=': (actual, expected) => Number(actual) <= Number(expected),
            '!=': (actual, expected) => String(actual) !== String(expected),
            'starts with': (actual, expected) => String(actual).toLowerCase().startsWith(String(expected).toLowerCase()),
            'ends with': (actual, expected) => String(actual).toLowerCase().endsWith(String(expected).toLowerCase()),
            'contains': (actual, expected) => String(actual).toLowerCase().includes(String(expected).toLowerCase()),
            'not contains': (actual, expected) => !String(actual).toLowerCase().includes(String(expected).toLowerCase()),
            'regex': (actual, expected) => new RegExp(expected).test(String(actual))
        };
    }

   
    validateTransactions(transactions, rules) {
        const results = [];

        for (const transaction of transactions) {
            const result = this.validateSingleTransaction(transaction, rules);
            results.push({
                transaction_id: transaction.id,
                transaction_number: transaction.number,
                is_valid: result.isValid,
                failed_rules: result.failedRules
            });
        }

        return results;
    }

    
    validateSingleTransaction(transaction, rules) {
        const ruleResults = [];
        
      
        for (const rule of rules) {
            const ruleResult = this.evaluateRule(transaction, rule);
            ruleResults.push({
                ...ruleResult,
                rule_id: rule.rule_id,
                logical_operator: rule.logical_operator
            });
        }

      
        const finalResult = this.applyLogicalOperators(ruleResults);
        
        return {
            isValid: finalResult.isValid,
            failedRules: finalResult.failedRules
        };
    }

  
    evaluateRule(transaction, rule) {
        const actualValue = transaction[rule.field_name];
        const expectedValue = rule.value;
        const operator = rule.operator;

        const operatorFunction = this.operators[operator];
        if (!operatorFunction) {
            throw new Error(`Unsupported operator: ${operator}`);
        }

        const passed = operatorFunction(actualValue, expectedValue);

        return {
            passed,
            field_name: rule.field_name,
            operator: operator,
            expected_value: expectedValue,
            actual_value: actualValue,
            error_message: passed ? null : `Field '${rule.field_name}' ${operator} '${expectedValue}' failed. Got: '${actualValue}'`
        };
    }

   
    applyLogicalOperators(ruleResults) {
        if (ruleResults.length === 0) {
            return { isValid: true, failedRules: [] };
        }

        let finalResult = ruleResults[0].passed;
        const failedRules = [];

       
        ruleResults.forEach(result => {
            if (!result.passed) {
                failedRules.push({
                    rule_id: result.rule_id,
                    field_name: result.field_name,
                    operator: result.operator,
                    expected_value: result.expected_value,
                    actual_value: result.actual_value,
                    error_message: result.error_message
                });
            }
        });

      
        for (let i = 1; i < ruleResults.length; i++) {
            const prevLogicalOp = ruleResults[i - 1].logical_operator;
            const currentResult = ruleResults[i].passed;

            if (prevLogicalOp === 'AND') {
                finalResult = finalResult && currentResult;
            } else if (prevLogicalOp === 'OR') {
                finalResult = finalResult || currentResult;
            }
        }

        return {
            isValid: finalResult,
            failedRules: failedRules
        };
    }
}

module.exports = new ValidationEngine();