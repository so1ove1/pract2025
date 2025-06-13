import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
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

        // Создаем новую книгу Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Прайс-лист');

        // Определяем заголовки
        const headers = [
            { header: '№', key: 'number', width: 5 },
            { header: 'Категория', key: 'category', width: 20 },
            { header: 'Материал', key: 'material', width: 30 },
            { header: 'Код материала', key: 'code', width: 15 },
            { header: 'Покрытие', key: 'coating', width: 20 },
            { header: 'Толщина (мм)', key: 'thickness', width: 12 },
            { header: 'Цена за м² (₽)', key: 'price', width: 15 },
            { header: 'Дата обновления', key: 'date', width: 15 }
        ];

        worksheet.columns = headers;

        // Стилизуем заголовки
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        };

        // Добавляем данные
        prices.forEach((price, index) => {
            worksheet.addRow({
                number: index + 1,
                category: price.Material.Category.name,
                material: price.Material.name,
                code: price.Material.code,
                coating: price.coating,
                thickness: price.thickness,
                price: price.price,
                date: new Date(price.date).toLocaleDateString('ru-RU')
            });
        });

        // Применяем границы к таблице
        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = borderStyle;
            });
        });

        // Устанавливаем заголовки для скачивания файла
        const filename = `pricelist_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Записываем в response
        await workbook.xlsx.write(res);
        res.end();
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
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        
        const worksheet = workbook.getWorksheet(1); // Первый лист
        
        if (!worksheet) {
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

        // Пропускаем заголовок (первая строка) и обрабатываем данные
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            
            // Пропускаем пустые строки
            if (row.hasValues === false) {
                continue;
            }

            try {
                // Получаем значения из ячеек
                const categoryName = row.getCell(2).text?.trim(); // Категория
                const materialName = row.getCell(3).text?.trim(); // Материал
                const materialCode = row.getCell(4).text?.trim(); // Код материала
                const coating = row.getCell(5).text?.trim(); // Покрытие
                const thickness = parseFloat(row.getCell(6).value); // Толщина
                const price = parseFloat(row.getCell(7).value); // Цена

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
                    const code = materialCode || materialName.replace(/\s+/g, '_').toUpperCase();
                    
                    material = await Material.create({
                        name: materialName,
                        code: code,
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
router.get('/template', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Создаем шаблон на лету
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Шаблон прайс-листа');

        // Определяем заголовки
        const headers = [
            { header: '№', key: 'number', width: 5 },
            { header: 'Категория', key: 'category', width: 20 },
            { header: 'Материал', key: 'material', width: 30 },
            { header: 'Код материала', key: 'code', width: 15 },
            { header: 'Покрытие', key: 'coating', width: 20 },
            { header: 'Толщина (мм)', key: 'thickness', width: 12 },
            { header: 'Цена за м² (₽)', key: 'price', width: 15 },
            { header: 'Дата обновления', key: 'date', width: 15 }
        ];

        worksheet.columns = headers;

        // Стилизуем заголовки
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        };

        // Добавляем примеры данных
        const exampleData = [
            {
                number: 1,
                category: 'Профлист',
                material: 'Профлист С-8',
                code: 'C8',
                coating: 'Полиэстер',
                thickness: 0.5,
                price: 450.00,
                date: new Date().toLocaleDateString('ru-RU')
            },
            {
                number: 2,
                category: 'Металлочерепица',
                material: 'Металлочерепица Монтеррей',
                code: 'MT_MONT',
                coating: 'Матовый полиэстер',
                thickness: 0.45,
                price: 520.00,
                date: new Date().toLocaleDateString('ru-RU')
            }
        ];

        exampleData.forEach(data => {
            worksheet.addRow(data);
        });

        // Применяем границы к таблице
        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = borderStyle;
            });
        });

        // Добавляем инструкции на второй лист
        const instructionsSheet = workbook.addWorksheet('Инструкции');
        instructionsSheet.addRow(['Инструкции по заполнению шаблона прайс-листа']);
        instructionsSheet.addRow([]);
        instructionsSheet.addRow(['1. № - порядковый номер (заполняется автоматически)']);
        instructionsSheet.addRow(['2. Категория - название категории материала (обязательно)']);
        instructionsSheet.addRow(['3. Материал - название материала (обязательно)']);
        instructionsSheet.addRow(['4. Код материала - уникальный код (необязательно)']);
        instructionsSheet.addRow(['5. Покрытие - тип покрытия материала (обязательно)']);
        instructionsSheet.addRow(['6. Толщина (мм) - толщина в миллиметрах (обязательно)']);
        instructionsSheet.addRow(['7. Цена за м² (₽) - цена за квадратный метр (обязательно)']);
        instructionsSheet.addRow(['8. Дата обновления - дата последнего обновления']);
        instructionsSheet.addRow([]);
        instructionsSheet.addRow(['Примечания:']);
        instructionsSheet.addRow(['- Если категория не существует, она будет создана автоматически']);
        instructionsSheet.addRow(['- Если материал не существует, он будет создан с базовыми параметрами']);
        instructionsSheet.addRow(['- При совпадении материала, покрытия и толщины цена будет обновлена']);

        // Стилизуем инструкции
        instructionsSheet.getRow(1).font = { bold: true, size: 14 };
        instructionsSheet.getColumn(1).width = 80;

        // Устанавливаем заголовки для скачивания файла
        res.setHeader('Content-Disposition', 'attachment; filename="price_template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Записываем в response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ message: 'Ошибка при создании шаблона' });
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