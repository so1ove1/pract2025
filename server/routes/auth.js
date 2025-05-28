import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const router = express.Router();

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
            process.env.JWT_SECRET,
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