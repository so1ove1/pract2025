import express from 'express';
import { Material, Price, Category } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get price list
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { categoryId } = req.query;
        
        const prices = await Price.findAll({
            include: [{
                model: Material,
                where: categoryId ? { categoryId } : {},
                include: [{ model: Category }]
            }],
            order: [['date', 'DESC']]
        });
        
        // Transform data to match the expected format
        const transformedPrices = prices.map(price => ({
            id: price.id,
            materialId: price.Material.id,
            materialName: price.Material.name,
            categoryName: price.Material.Category.name,
            coating: price.coating,
            thickness: price.thickness,
            price: price.price,
            date: price.date
        }));
        
        res.json(transformedPrices);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении прайс-листа' });
    }
});

// Add price (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.create(req.body);
        res.status(201).json(price);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении позиции' });
    }
});

// Update price (admin only)
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

// Delete price (admin only)
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