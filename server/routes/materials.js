import express from 'express';
import { Category, Material, Price } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';

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

// Create category (admin only)
router.post('/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: 'Название категории обязательно' });
        }

        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(400).json({ message: 'Категория с таким названием уже существует' });
        }

        const category = await Category.create({ name });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Ошибка при создании категории' });
    }
});

// Update category (admin only)
router.put('/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const categoryId = parseInt(req.params.id);

        if (!name) {
            return res.status(400).json({ message: 'Название категории обязательно' });
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Категория не найдена' });
        }

        const existingCategory = await Category.findOne({ 
            where: { 
                name,
                id: { [Op.ne]: categoryId }
            }
        });
        
        if (existingCategory) {
            return res.status(400).json({ message: 'Категория с таким названием уже существует' });
        }

        await category.update({ name });
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Ошибка при обновлении категории' });
    }
});

// Delete category (admin only)
router.delete('/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Категория не найдена' });
        }

        // Check if category has materials
        const materialsCount = await Material.count({ 
            where: { category_id: req.params.id }
        });

        if (materialsCount > 0) {
            return res.status(400).json({ 
                message: 'Невозможно удалить категорию, содержащую материалы' 
            });
        }

        await category.destroy();
        res.json({ message: 'Категория успешно удалена' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Ошибка при удалении категории' });
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
