
const { pool } = require('../db');

class TransactionService {
    
    async getAllTransactions() {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    t.*,
                    v.vendor_name
                FROM transactions t
                LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
                ORDER BY t.created_at DESC;
            `;
            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    }

   
    async getTransactionsByIds(transactionIds) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    t.*,
                    v.vendor_name
                FROM transactions t
                LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
                WHERE t.id = ANY($1::int[])
                ORDER BY t.created_at DESC;
            `;
            const result = await client.query(query, [transactionIds]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    
    async createSampleData() {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

          
            await client.query(`
                INSERT INTO vendors (vendor_name) VALUES 
                ('Vendor A'), ('Vendor B'), ('Vendor C')
                ON CONFLICT DO NOTHING;
            `);

          
            await client.query(`
                INSERT INTO transactions (number, amount, memo, date, vendor_id) VALUES 
                ('TXN001', 15.50, 'Sample transaction 1', '2025-01-15', 1),
                ('TXN002', 8.75, 'Another transaction', '2025-01-16', 2),
                ('TXN003', 25.00, 'Large transaction', '2025-01-17', 1),
                ('TXN004', 5.25, 'Small amount', '2025-01-18', 3),
                ('TXN005', 12.00, 'Regular payment', '2025-01-19', 2)
                ON CONFLICT DO NOTHING;
            `);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new TransactionService();