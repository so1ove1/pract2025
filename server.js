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
        : ['http://localhost:3000', 'http://localhost:3001'],
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

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }
    res.status(err.status || 500).json({ 
        message: err.message || 'Internal server error'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 3001;
const HOST = 'localhost'; // Changed to allow external access

sequelize.authenticate()
    .then(() => {
        console.log('Database connection established');
        return sequelize.sync();
    })
    .then(() => {
        const server = app.listen(PORT, HOST, () => {
            console.log(`Server running on ${HOST}:${PORT}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please try a different port.`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
            }
        });
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });