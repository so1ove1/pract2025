import express from 'express';
import { Material, Price } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Получение прайс-листа
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { categoryId } = req.query;
        
        const prices = await Price.findAll({
            include: [{
                model: Material,
                where: categoryId ? { categoryId } : {}
            }],
            order: [['date', 'DESC']]
        });
        
        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении прайс-листа' });
    }
});

// Добавление позиции в прайс-лист (только для админов)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.create(req.body);
        res.status(201).json(price);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении позиции' });
    }
});

// Обновление позиции в прайс-листе (только для админов)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id);
        
        if (!price) {
            return res.status(404).json({ message: 'Позиция не найдена' });
        }
        
        await price.update(req.body);
        res.json(price);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении позиции' });
    }
});

// Удаление позиции из прайс-листа (только для админов)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id);
        
        if (!price) {
            return res.status(404).json({ message: 'Позиция не найдена' });
        }
        
        await price.destroy();
        res.json({ message: 'Позиция успешно удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении позиции' });
    }
});

export default router;