
DROP TABLE IF EXISTS validation_results CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS rule_sets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;


CREATE TABLE vendors (
    vendor_id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    memo TEXT,
    date DATE NOT NULL,
    vendor_id INTEGER REFERENCES vendors(vendor_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE rule_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);


CREATE TABLE rules (
    id SERIAL PRIMARY KEY,
    rule_set_id INTEGER REFERENCES rule_sets(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    value VARCHAR(255) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    logical_operator VARCHAR(10) CHECK (logical_operator IN ('AND', 'OR')),
    rule_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE validation_results (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id),
    rule_set_id INTEGER REFERENCES rule_sets(id),
    is_valid BOOLEAN NOT NULL,
    failed_rules JSONB,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_rules_rule_set_id ON rules(rule_set_id);
CREATE INDEX idx_validation_results_transaction_id ON validation_results(transaction_id);
CREATE INDEX idx_validation_results_rule_set_id ON validation_results(rule_set_id);


INSERT INTO vendors (vendor_name) VALUES 
    ('Vendor A'),
    ('Vendor B'), 
    ('Vendor C');


INSERT INTO transactions (number, amount, memo, date, vendor_id) VALUES 
    ('TXN001', 15.50, 'annual subscription', '2025-01-15', 1),
    ('TXN002', 8.75, 'apple purchase', '2025-01-16', 2),
    ('TXN003', 25.00, 'big transaction', '2025-01-17', 1),
    ('TXN004', 5.25, 'amazon order', '2025-01-18', 3),
    ('TXN005', 12.00, 'zebra payment', '2025-01-19', 2),
    ('TXN006', 3.00, '', '2025-01-20', 1),
    ('TXN007', 7.50, 'automatic payment', '2025-01-21', 3);

COMMIT;