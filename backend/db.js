require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    
   
    max: 20,                  
    idleTimeoutMillis: 30000,  
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const connectDb = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log(" Database connection successful.");
        

        const result = await client.query('SELECT NOW()');
        console.log(` Connected at: ${result.rows[0].now}`);
        
        client.release();
    } catch (err) {
        console.error("Failed to connect to the database.");
        console.error("Please check your .env file and ensure the database server is running.");
        console.error("Error details:", err.message);
        process.exit(1);
    }
};


const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { pool, connectDb, query }