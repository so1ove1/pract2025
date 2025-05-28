import express from 'express';
import { Calculation } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get calculations history
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { dateFrom, dateTo, type, amountFrom, amountTo } = req.query;
        const where = { userId: req.user.id };
        
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.$gte = new Date(dateFrom);
            if (dateTo) where.createdAt.$lte = new Date(dateTo);
        }
        
        if (type) where.type = type;
        
        if (amountFrom || amountTo) {
            where.amount = {};
            if (amountFrom) where.amount.$gte = parseFloat(amountFrom);
            if (amountTo) where.amount.$lte = parseFloat(amountTo);
        }
        
        const calculations = await Calculation.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        
        res.json(calculations);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении расчетов' });
    }
});

// Save calculation
router.post('/', authenticateToken, async (req, res) => {
    try {
        const calculation = await Calculation.create({
            ...req.body,
            userId: req.user.id
        });
        
        res.status(201).json(calculation);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при сохранении расчета' });
    }
});

// Delete calculation
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const calculation = await Calculation.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        
        if (!calculation) {
            return res.status(404).json({ message: 'Расчет не найден' });
        }
        
        await calculation.destroy();
        res.json({ message: 'Расчет успешно удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении расчета' });
    }
});

export default router;