# rule-engine-data-validation

A web application for creating custom validation rules and checking transaction data. Features a simple web interface and Node.js backend.

## What it does

- Create validation rules (like "amount < 100" or "memo starts with 'approved'")
- Check transactions against your rules
- Find transactions that match your criteria
- View results in a clean web interface

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL

## Quick Setup

### Prerequisites
- Node.js
- PostgreSQL

### Installation

1. **Clone the project**
   ```bash
   git clone https://github.com/yourusername/data-validation-system.git
   cd data-validation-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   Create `.env` file:
   ```
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=validation_system
   DB_PASSWORD=your_password
   DB_PORT=5432
   ```

4. **Setup database**
   ```bash
   node setUpDB.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open the app**
   Open `frontend/index.html` in your browser

## How to Use

### Web Interface
1. Open the app in your browser
2. Check that it shows "✅ Connected" in the top right
3. Create rules using the form:
   - Choose a field (Amount, Memo, etc.)
   - Pick an operator (less than, contains, etc.)
   - Enter a value
4. Click "Create Rule Set"
5. Click "Validate All Transactions" to check compliance
6. Click "Query Matching Transactions" to find matches

### Sample Data
The system comes with 7 sample transactions to test with.

## API Endpoints

```bash
# Get available fields
GET /api/validation-rules/supported-fields

# Create rules
POST /api/validation-rules/rule-sets
{
  "name": "My Rules",
  "rules": [
    {"fieldName": "amount", "operator": "<", "value": "100"}
  ]
}

# Check transactions
POST /api/validation-rules/validate
{"ruleSetId": 1}

# Find matching transactions
POST /api/validation-rules/query
{"ruleSetId": 1}
```

## Project Structure

```
├── frontend/
│   └── index.html          # Web interface
├── backend/
│   ├── controllers/        # API logic
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── db.js              # Database connection
│   └── index.js           # Main server
├── createTables.sql       # Database setup
├── setUpDB.js            # Setup script
└── package.json
```

## Troubleshooting

**Can't connect to backend?**
- Make sure server is running: `npm start`
- Check if you see "Connected" in the web interface

**Database errors?**
- Run: `node setUpDB.js`
- Check PostgreSQL is running
- Verify your `.env` file

**Frontend not working?**
- Try a different browser
- Check browser console for errors
- Make sure you opened `index.html`

## Sample Rules

Try these example rules:
- Amount less than 10: `amount < 10`
- Memo contains "apple": `memo contains apple`
- Amount between 5-15: `amount > 5 AND amount < 15`

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make changes and commit: `git commit -m 'Add feature'`
4. Push: `git push origin my-feature`
5. Create Pull Request

## License

MIT License
