import express from 'express';
import { Category, Material } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Получение всех категорий
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении категорий' });
    }
});

// Получение всех материалов
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { categoryId } = req.query;
        const where = categoryId ? { categoryId } : {};
        
        const materials = await Material.findAll({
            where,
            include: [{ model: Category }]
        });
        
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении материалов' });
    }
});

// Создание материала (только для админов)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const material = await Material.create(req.body);
        res.status(201).json(material);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании материала' });
    }
});

// Обновление материала (только для админов)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const material = await Material.findByPk(req.params.id);
        
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        
        await material.update(req.body);
        res.json(material);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении материала' });
    }
});

// Удаление материала (только для админов)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const material = await Material.findByPk(req.params.id);
        
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        
        await material.destroy();
        res.json({ message: 'Материал успешно удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении материала' });
    }
});

export default router;