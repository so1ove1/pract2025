import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { Material, Price, Category } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.originalname.endsWith('.xlsx')) {
            cb(null, true);
        } else {
            cb(new Error('Только XLSX файлы разрешены'), false);
        }
    }
});

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

// Export price list to XLSX
router.get('/export', authenticateToken, isAdmin, async (req, res) => {
    try {
        const prices = await Price.findAll({
            include: [
                {
                    model: Material,
                    include: [Category]
                }
            ],
            order: [['date', 'DESC']]
        });

        // Подготавливаем данные для экспорта
        const exportData = prices.map((price, index) => ({
            '№': index + 1,
            'Категория': price.Material.Category.name,
            'Материал': price.Material.name,
            'Код материала': price.Material.code,
            'Покрытие': price.coating,
            'Толщина (мм)': price.thickness,
            'Цена за м² (₽)': price.price,
            'Дата обновления': new Date(price.date).toLocaleDateString('ru-RU')
        }));

        // Создаем новую книгу Excel
        const workbook = XLSX.utils.book_new();
        
        // Создаем лист с данными
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Настраиваем ширину колонок
        const columnWidths = [
            { wch: 5 },   // №
            { wch: 20 },  // Категория
            { wch: 30 },  // Материал
            { wch: 15 },  // Код материала
            { wch: 20 },  // Покрытие
            { wch: 12 },  // Толщина
            { wch: 15 },  // Цена
            { wch: 15 }   // Дата
        ];
        worksheet['!cols'] = columnWidths;

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Прайс-лист');

        // Генерируем буфер
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Устанавливаем заголовки для скачивания файла
        const filename = `pricelist_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exporting prices:', error);
        res.status(500).json({ message: 'Ошибка при экспорте прайс-листа' });
    }
});

// Import price list from XLSX
router.post('/import', authenticateToken, isAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }

        // Читаем загруженный файл
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Преобразуем в JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            // Удаляем загруженный файл
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Файл пуст или имеет неверный формат' });
        }

        // Получаем все материалы и категории для сопоставления
        const materials = await Material.findAll({
            include: [Category]
        });
        const categories = await Category.findAll();

        const results = {
            success: 0,
            errors: [],
            warnings: []
        };

        // Обрабатываем каждую строку
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 потому что первая строка - заголовки, и индекс начинается с 0

            try {
                // Проверяем обязательные поля
                const categoryName = row['Категория']?.toString().trim();
                const materialName = row['Материал']?.toString().trim();
                const coating = row['Покрытие']?.toString().trim();
                const thickness = parseFloat(row['Толщина (мм)']);
                const price = parseFloat(row['Цена за м² (₽)']);

                if (!categoryName || !materialName || !coating || isNaN(thickness) || isNaN(price)) {
                    results.errors.push(`Строка ${rowNumber}: Не заполнены обязательные поля`);
                    continue;
                }

                // Ищем категорию
                let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                if (!category) {
                    // Создаем новую категорию
                    category = await Category.create({ name: categoryName });
                    categories.push(category);
                    results.warnings.push(`Строка ${rowNumber}: Создана новая категория "${categoryName}"`);
                }

                // Ищем материал
                let material = materials.find(m => 
                    m.name.toLowerCase() === materialName.toLowerCase() && 
                    m.category_id === category.id
                );

                if (!material) {
                    // Создаем новый материал с базовыми параметрами
                    const materialCode = row['Код материала']?.toString().trim() || 
                                       materialName.replace(/\s+/g, '_').toUpperCase();
                    
                    material = await Material.create({
                        name: materialName,
                        code: materialCode,
                        unit: 'м²',
                        category_id: category.id,
                        overall_width: 1.0,
                        working_width: 1.0
                    });
                    materials.push(material);
                    results.warnings.push(`Строка ${rowNumber}: Создан новый материал "${materialName}"`);
                }

                // Проверяем, существует ли уже такая позиция в прайс-листе
                const existingPrice = await Price.findOne({
                    where: {
                        material_id: material.id,
                        coating: coating,
                        thickness: thickness
                    }
                });

                if (existingPrice) {
                    // Обновляем существующую цену
                    await existingPrice.update({
                        price: price,
                        date: new Date()
                    });
                    results.warnings.push(`Строка ${rowNumber}: Обновлена цена для "${materialName}" (${coating}, ${thickness}мм)`);
                } else {
                    // Создаем новую позицию
                    await Price.create({
                        material_id: material.id,
                        coating: coating,
                        thickness: thickness,
                        price: price,
                        date: new Date()
                    });
                }

                results.success++;
            } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                results.errors.push(`Строка ${rowNumber}: ${error.message}`);
            }
        }

        // Удаляем загруженный файл
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Импорт завершен',
            results: results
        });
    } catch (error) {
        console.error('Error importing prices:', error);
        
        // Удаляем файл в случае ошибки
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: 'Ошибка при импорте прайс-листа' });
    }
});

// Download template
router.get('/template', authenticateToken, isAdmin, (req, res) => {
    try {
        const templatePath = path.join(process.cwd(), 'server', 'templates', 'price_template.xlsx');
        
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ message: 'Шаблон не найден' });
        }

        res.download(templatePath, 'price_template.xlsx', (err) => {
            if (err) {
                console.error('Error downloading template:', err);
                res.status(500).json({ message: 'Ошибка при скачивании шаблона' });
            }
        });
    } catch (error) {
        console.error('Error serving template:', error);
        res.status(500).json({ message: 'Ошибка при получении шаблона' });
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