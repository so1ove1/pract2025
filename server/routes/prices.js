import express from 'express';
import { Material, Price, Category } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get price list
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { categoryId } = req.query;

        const include = [{
            model: Material,
            attributes: ['id', 'name', 'code', 'unit', 'overall_width', 'working_width'],
            include: [{
                model: Category,
                attributes: ['id', 'name']
            }]
        }];

        const where = {};
        if (categoryId) {
            where['$Material.category_id$'] = categoryId;
        }

        const prices = await Price.findAll({
            where,
            include: [
                {
                    model: Material,
                    include: [Category]
                }
            ],
            order: [['date', 'DESC']]
        });

        // Transform response to include nested data
        const transformedPrices = prices.map(price => ({
            id: price.id,
            materialId: price.material_id,
            materialName: price.Material.name,
            categoryName: price.Material.Category.name,
            coating: price.coating,
            thickness: price.thickness,
            price: price.price,
            date: price.date,
            material: {
                id: price.Material.id,
                name: price.Material.name,
                code: price.Material.code,
                unit: price.Material.unit,
                overallWidth: price.Material.overall_width,
                workingWidth: price.Material.working_width,
                category_id: price.Material.category_id
            }
        }));

        res.json(transformedPrices);
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ message: 'Ошибка при получении прайс-листа' });
    }
});

// Add price (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.create(req.body);
        res.status(201).json(price);
    } catch (error) {
        console.error('Error creating price:', error);
        res.status(500).json({ message: 'Ошибка при добавлении цены' });
    }
});

// Update price (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id);

        if (!price) {
            return res.status(404).json({ message: 'Цена не найдена' });
        }

        await price.update(req.body);
        res.json(price);
    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({ message: 'Ошибка при обновлении цены' });
    }
});

// Delete price (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id);

        if (!price) {
            return res.status(404).json({ message: 'Цена не найдена' });
        }

        await price.destroy();
        res.json({ message: 'Цена успешно удалена' });
    } catch (error) {
        console.error('Error deleting price:', error);
        res.status(500).json({ message: 'Ошибка при удалении цены' });
    }
});

export default router;