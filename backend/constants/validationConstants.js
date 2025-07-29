const SUPPORTED_FIELDS = [
    { name: 'number', type: 'text' }, 
    { name: 'amount', type: 'number' },
    { name: 'memo', type: 'text' },
    { name: 'date', type: 'date' },
    { name: 'vendor_name', type: 'text' }
];

const SUPPORTED_OPERATORS = {
    numeric: [
        { name: 'EQUALS', symbol: '=' },
        { name: 'NOT_EQUALS', symbol: '!=' },
        { name: 'GREATER_THAN', symbol: '>' },
        { name: 'LESS_THAN', symbol: '<' },
        { name: 'GREATER_THAN_OR_EQUALS', symbol: '>=' },
        { name: 'LESS_THAN_OR_EQUALS', symbol: '<=' }
    ],
    text: [
        { name: 'EQUALS', symbol: '=' },
        { name: 'NOT_EQUALS', symbol: '!=' },
        { name: 'CONTAINS', symbol: 'contains' },
        { name: 'NOT_CONTAINS', symbol: 'not contains' },
        { name: 'STARTS_WITH', symbol: 'starts with' },
        { name: 'ENDS_WITH', symbol: 'ends with' },
        { name: 'REGEX', symbol: 'regex' }
    ],
    date: [
        { name: 'EQUALS', symbol: 'on' },
        { name: 'NOT_EQUALS', symbol: 'not on' },
        { name: 'DATE_BEFORE', symbol: 'before' },
        { name: 'DATE_AFTER', symbol: 'after' }
    ]
};

module.exports = {
    SUPPORTED_FIELDS,
    SUPPORTED_OPERATORS
};