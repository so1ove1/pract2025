import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Требуется авторизация' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Недействительный токен' });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    next();
};