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
            attributes: ['id', 'login', 'name', 'role', 'last_login'],
            order: [['name', 'ASC']]
        });
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
    }
});

// User authentication
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        if (!login || !password) {
            return res.status(400).json({ message: 'Требуется логин и пароль' });
        }
        
        const user = await User.findOne({ where: { login } });
        
        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }
        
        // Update last login time
        await user.update({ last_login: new Date() });
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                role: user.role,
                last_login: user.last_login
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Ошибка аутентификации' });
    }
});

// Validate token
router.get('/validate', authenticateToken, (req, res) => {
    res.json({ 
        valid: true,
        user: {
            id: req.user.id,
            login: req.user.login,
            name: req.user.name,
            role: req.user.role
        }
    });
});

// Create new user (admin only)
router.post('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { login, name, password, role } = req.body;
        
        if (!login || !name || !password || !role) {
            return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
        }
        
        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        
        const user = await User.create({ login, name, password, role });
        res.status(201).json({
            id: user.id,
            login: user.login,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Ошибка при создании пользователя' });
    }
});

export default router;