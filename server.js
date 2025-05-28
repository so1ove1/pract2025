import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './server/config/database.js';

// Import routes
import authRoutes from './server/routes/auth.js';
import materialsRoutes from './server/routes/materials.js';
import pricesRoutes from './server/routes/prices.js';
import calculationsRoutes from './server/routes/calculations.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'https://manager.bratskprofil.ru',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/calculations', calculationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: err.message || 'Internal Server Error'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 8080;

sequelize.authenticate()
    .then(() => {
        console.log('Database connection established');
        app.listen(PORT, '127.0.0.1', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });