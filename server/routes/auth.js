import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for dropdown)
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'login', 'name', 'role', 'lastLogin'],
            order: [['name', 'ASC']]
        });
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Аутентификация пользователя
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        const user = await User.findOne({ where: { login } });
        
        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }
        
        // Обновляем время последнего входа
        await user.update({ lastLogin: new Date() });
        
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Ошибка при аутентификации:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;