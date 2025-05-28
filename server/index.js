import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';

// Import routes (we'll create these next)
import authRoutes from './routes/auth.js';
import materialsRoutes from './routes/materials.js';
import pricesRoutes from './routes/prices.js';
import calculationsRoutes from './routes/calculations.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/calculations', calculationsRoutes);

const PORT = process.env.PORT || 3000;

// Sync database and start server
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}).catch(err => {
    console.error('Ошибка при синхронизации с базой данных:', err);
});