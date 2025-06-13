import express from 'express';
import { Calculation } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получение истории расчетов пользователя
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { dateFrom, dateTo, type, amountFrom, amountTo } = req.query;
        const where = { user_id: req.user.id }; // Updated to user_id to match schema

        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) where.created_at.$gte = new Date(dateFrom);
            if (dateTo) where.created_at.$lte = new Date(dateTo);
        }

        if (type) where.type = type;

        if (amountFrom || amountTo) {
            where.amount = {};
            if (amountFrom) where.amount.$gte = parseFloat(amountFrom);
            if (amountTo) where.amount.$lte = parseFloat(amountTo);
        }

        const calculations = await Calculation.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

        res.json(calculations);
    } catch (error) {
        console.error('Error fetching calculations:', error);
        res.status(500).json({ message: 'Ошибка при получении расчетов', error: error.message });
    }
});

// Сохранение расчета
router.post('/', authenticateToken, async (req, res) => {
    try {
        const calculation = await Calculation.create({
            ...req.body,
            user_id: req.user.id 
        });

        res.status(201).json(calculation);
    } catch (error) {
        console.error('Error saving calculation:', error);
        res.status(500).json({ message: 'Ошибка при сохранении расчета', error: error.message });
    }
});

// Удаление расчета
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const calculation = await Calculation.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id // Updated to user_id to match schema
            }
        });

        if (!calculation) {
            return res.status(404).json({ message: 'Расчет не найден' });
        }

        await calculation.destroy();
        res.json({ message: 'Расчет успешно удален' });
    } catch (error) {
        console.error('Error deleting calculation:', error);
        res.status(500).json({ message: 'Ошибка при удалении расчета', error: error.message });
    }
});

// Обновление расчета
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const calculation = await Calculation.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!calculation) {
            return res.status(404).json({ message: 'Расчет не найден' });
        }

        await calculation.update(req.body);
        res.json(calculation);
    } catch (error) {
        console.error('Error updating calculation:', error);
        res.status(500).json({ message: 'Ошибка при обновлении расчета', error: error.message });
    }
});

export default router;