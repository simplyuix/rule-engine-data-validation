const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  
    const adminPool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres', 
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        console.log('Checking if database exists...');
        
      
        const dbCheckQuery = `
            SELECT 1 FROM pg_database WHERE datname = $1
        `;
        const dbResult = await adminPool.query(dbCheckQuery, [process.env.DB_NAME]);
        
        if (dbResult.rows.length === 0) {
            console.log(` Creating database: ${process.env.DB_NAME}`);
            await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('Database created successfully');
        } else {
            console.log('Database already exists');
        }
        
        await adminPool.end();

      
        const appPool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        console.log('📋 Creating tables and inserting sample data...');
        
      
        const sqlFile = fs.readFileSync(path.join(__dirname, 'createTables.sql'), 'utf8');
        await appPool.query(sqlFile);
        
        console.log(' Tables created and sample data inserted successfully');
        
       
        const vendorCount = await appPool.query('SELECT COUNT(*) FROM vendors');
        const transactionCount = await appPool.query('SELECT COUNT(*) FROM transactions');
        
        console.log(` Setup complete:`);
        console.log(`   Vendors: ${vendorCount.rows[0].count}`);
        console.log(`   Transactions: ${transactionCount.rows[0].count}`);
        
        await appPool.end();
        
    } catch (error) {
        console.error(' Database setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;