const express = require('express');
const cors = require('cors');

const { connectDb } = require('./db');
const validationRoutes = require('./routes/validationRoute'); 

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Data Validation System Backend is running!');
});

app.use('/api/validation-rules', validationRoutes);

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

const startServer = async () => {
    try {
        await connectDb();
        app.listen(port, () => {
            console.log(`Backend server listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();