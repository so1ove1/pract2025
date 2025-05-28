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
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://manager.bratskprofil.ru' 
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
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
        message: err.message || 'Внутренняя ошибка сервера'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

sequelize.authenticate()
    .then(() => {
        console.log('Database connection established');
        app.listen(PORT, HOST, () => {
            console.log(`Server running on ${HOST}:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });