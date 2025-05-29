import express from 'express';
import { Category, Material, Price } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']]
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Ошибка при получении категорий' });
    }
});

// Get all materials
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { categoryId } = req.query;
        const where = {};
        
        if (categoryId) {
            where.category_id = categoryId;
        }
        
        const materials = await Material.findAll({
            where,
            include: [{
                model: Category,
                attributes: ['id', 'name']
            }],
            order: [['name', 'ASC']]
        });
        
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ message: 'Ошибка при получении материалов' });
    }
});

// Create material (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const material = await Material.create(req.body);
        res.status(201).json(material);
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ message: 'Ошибка при создании материала' });
    }
});

// Update material (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const material = await Material.findByPk(req.params.id);
        
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        
        await material.update(req.body);
        res.json(material);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ message: 'Ошибка при обновлении материала' });
    }
});

// Delete material (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const material = await Material.findByPk(req.params.id);
        
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        
        await material.destroy();
        res.json({ message: 'Материал успешно удален' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: 'Ошибка при удалении материала' });
    }
});

export default router;