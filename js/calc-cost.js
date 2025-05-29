/**
 * calc-cost.js - Скрипт для страницы расчета стоимости
 */

import { api, formatCurrency } from './main.js';

// Глобальные переменные
let itemsData = []; // Массив для хранения добавленных товаров

document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация кнопок
    const addItemBtn = document.getElementById('addItemBtn');
    const saveCalculationBtn = document.getElementById('saveCalculationBtn');
    const printCalculationBtn = document.getElementById('printCalculationBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelMaterialBtn = document.getElementById('cancelMaterialBtn');
    
    // Обработчики событий
    if (addItemBtn) addItemBtn.addEventListener('click', openMaterialModal);
    if (saveCalculationBtn) saveCalculationBtn.addEventListener('click', saveCalculation);
    if (printCalculationBtn) printCalculationBtn.addEventListener('click', printCalculation);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeMaterialModal);
    if (cancelMaterialBtn) cancelMaterialBtn.addEventListener('click', closeMaterialModal);
    
    // Инициализация модального окна выбора материала
    await initMaterialModal();
    
    // Инициализация таблицы
    updateCalculationTable();
});

/**
 * Инициализация модального окна выбора материала
 */
async function initMaterialModal() {
    const materialCategory = document.getElementById('materialCategory');
    const materialSearch = document.getElementById('materialSearch');
    const materialsList = document.getElementById('materialsList');
    
    try {
        // Загружаем категории материалов
        const categories = await api.categories.getAll();
        
        if (materialCategory) {
            materialCategory.innerHTML = '<option value="">Все категории</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                materialCategory.appendChild(option);
            });
        }
        
        // Загружаем начальный список материалов
        await loadMaterialsList();
        
        // Обработчики событий для фильтрации
        if (materialCategory) {
            materialCategory.addEventListener('change', loadMaterialsList);
        }
        if (materialSearch) {
            materialSearch.addEventListener('input', loadMaterialsList);
        }
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
    }
}

/**
 * Загрузка списка материалов
 */
async function loadMaterialsList() {
    const materialCategory = document.getElementById('materialCategory');
    const materialSearch = document.getElementById('materialSearch');
    const materialsList = document.getElementById('materialsList');
    
    if (!materialsList) return;
    
    try {
        // Подготавливаем параметры запроса
        const params = {};
        
        if (materialCategory && materialCategory.value) {
            params.categoryId = materialCategory.value;
        }
        
        // Загружаем материалы и прайс-лист
        const materials = await api.materials.getAll(params);
        const priceList = await api.prices.getAll(params);
        
        // Очищаем список
        materialsList.innerHTML = '';
        
        // Фильтрация по поисковому запросу
        const searchTerm = materialSearch ? materialSearch.value.toLowerCase() : '';
        const filteredMaterials = materials.filter(material => 
            material.name.toLowerCase().includes(searchTerm) || 
            material.code.toLowerCase().includes(searchTerm)
        );
        
        // Если ничего не найдено
        if (filteredMaterials.length === 0) {
            materialsList.innerHTML = '<div class="no-data">Ничего не найдено</div>';
            return;
        }
        
        // Добавляем материалы в список
        filteredMaterials.forEach(material => {
            // Находим все ценовые позиции для данного материала
            const priceOptions = priceList.filter(item => item.materialId === material.id);
            
            if (priceOptions.length > 0) {
                const materialItem = document.createElement('div');
                materialItem.className = 'material-item';
                
                materialItem.innerHTML = `
                    <div class="material-info">
                        <h3>${material.name}</h3>
                        <p>Код: ${material.code}</p>
                    </div>
                    <div class="price-options">
                        <select class="price-select">
                            ${priceOptions.map(option => `
                                <option value="${option.id}" 
                                    data-material-id="${material.id}"
                                    data-material-name="${material.name}"
                                    data-unit="${material.unit}"
                                    data-price="${option.price}"
                                    data-coating="${option.coating}"
                                    data-thickness="${option.thickness}"
                                    data-overall-width="${material.overall_width || 1}"
                                    data-working-width="${material.working_width || 1}">
                                    ${option.coating}, ${option.thickness} мм - ${formatCurrency(option.price)} ₽/${material.unit}
                                </option>
                            `).join('')}
                        </select>
                        <button class="btn btn-primary add-material-btn">Добавить</button>
                    </div>
                `;
                
                // Обработчик для кнопки добавления
                const addBtn = materialItem.querySelector('.add-material-btn');
                addBtn.addEventListener('click', () => {
                    const select = materialItem.querySelector('.price-select');
                    const option = select.options[select.selectedIndex];
                    
                    addMaterialToCalculation({
                        materialId: option.getAttribute('data-material-id'),
                        priceId: select.value,
                        name: option.getAttribute('data-material-name'),
                        unit: option.getAttribute('data-unit'),
                        price: parseFloat(option.getAttribute('data-price')),
                        coating: option.getAttribute('data-coating'),
                        thickness: parseFloat(option.getAttribute('data-thickness')),
                        overallWidth: parseFloat(option.getAttribute('data-overall-width')),
                        workingWidth: parseFloat(option.getAttribute('data-working-width'))
                    });
                    
                    // Закрываем модальное окно
                    closeMaterialModal();
                });
                
                materialsList.appendChild(materialItem);
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке материалов:', error);
        if (materialsList) {
            materialsList.innerHTML = '<div class="error-message">Ошибка при загрузке данных</div>';
        }
    }
}

/**
 * Открытие модального окна выбора материала
 */
function openMaterialModal() {
    const modal = document.getElementById('materialSelectionModal');
    if (modal) modal.style.display = 'block';
}

/**
 * Закрытие модального окна выбора материала
 */
function closeMaterialModal() {
    const modal = document.getElementById('materialSelectionModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Добавление материала в расчет
 */
function addMaterialToCalculation(materialData) {
    // Добавляем новый материал с начальными значениями
    const newItem = {
        ...materialData,
        length: 1, // Длина в метрах
        quantity: 1, // Количество листов
        total: calculateItemTotal(materialData.price, 1, materialData.overallWidth || 1, 1)
    };
    
    itemsData.push(newItem);
    
    // Обновляем таблицу
    updateCalculationTable();
}

/**
 * Расчет стоимости для одной позиции
 * @param {number} price - Цена за м²
 * @param {number} length - Длина в метрах
 * @param {number} overallWidth - Габаритная ширина в метрах
 * @param {number} quantity - Количество листов
 * @returns {number} - Итоговая стоимость
 */
function calculateItemTotal(price, length, overallWidth, quantity) {
    return price * overallWidth * length * quantity;
}

/**
 * Обновление таблицы расчета
 */
function updateCalculationTable() {
    const tableBody = document.getElementById('itemsTableBody');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (!tableBody || !totalAmountElement) return;
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Если нет товаров, показываем сообщение
    if (itemsData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" class="text-center">Нет добавленных товаров</td>
        `;
        tableBody.appendChild(emptyRow);
        totalAmountElement.textContent = '0.00 ₽';
        return;
    }
    
    // Добавляем строки для каждого товара
    let totalAmount = 0;
    
    itemsData.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Обновляем итоговую сумму для товара
        item.total = calculateItemTotal(item.price, item.length, item.overallWidth, item.quantity);
        totalAmount += item.total;
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name} (${item.coating}, ${item.thickness} мм)</td>
            <td>${item.unit}</td>
            <td>
                <input type="number" class="length-input" value="${item.length}" 
                    min="0.1" step="0.1" data-index="${index}">
            </td>
            <td>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                    min="1" step="1" data-index="${index}">
            </td>
            <td>
                <input type="number" class="price-input" value="${item.price}" 
                    min="0.01" step="0.01" data-index="${index}">
            </td>
            <td>${formatCurrency(item.total)} ₽</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-info btn-copy" data-index="${index}" title="Копировать">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-item-btn" data-index="${index}" title="Удалить">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Обновляем итоговую сумму
    totalAmountElement.textContent = `${formatCurrency(totalAmount)} ₽`;
    
    // Добавляем обработчики для изменения длины, количества и цены
    const lengthInputs = document.querySelectorAll('.length-input');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    const priceInputs = document.querySelectorAll('.price-input');
    const copyButtons = document.querySelectorAll('.btn-copy');
    const deleteButtons = document.querySelectorAll('.delete-item-btn');
    
    // Обработчики для изменения длины
    lengthInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const length = parseFloat(input.value);
            
            if (length <= 0 || isNaN(length)) {
                input.value = itemsData[index].length;
                return;
            }
            
            itemsData[index].length = length;
            updateCalculationTable();
        });
    });
    
    // Обработчики для изменения количества
    quantityInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const quantity = parseInt(input.value);
            
            if (quantity <= 0 || isNaN(quantity)) {
                input.value = itemsData[index].quantity;
                return;
            }
            
            itemsData[index].quantity = quantity;
            updateCalculationTable();
        });
    });
    
    // Обработчики для изменения цены
    priceInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const price = parseFloat(input.value);
            
            if (price <= 0 || isNaN(price)) {
                input.value = itemsData[index].price;
                return;
            }
            
            itemsData[index].price = price;
            updateCalculationTable();
        });
    });
    
    // Обработчики для копирования
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            const itemToCopy = { ...itemsData[index] };
            itemsData.push(itemToCopy);
            updateCalculationTable();
        });
    });
    
    // Обработчики для удаления
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            
            if (confirm('Вы уверены, что хотите удалить этот товар?')) {
                itemsData.splice(index, 1);
                updateCalculationTable();
            }
        });
    });
}

/**
 * Сохранение расчета
 */
async function saveCalculation() {
    const calculationName = document.getElementById('calculationName').value;
    
    if (itemsData.length === 0) {
        alert('Добавьте хотя бы один товар для сохранения расчета');
        return;
    }
    
    if (!calculationName) {
        alert('Пожалуйста, введите название расчета');
        document.getElementById('calculationName').focus();
        return;
    }
    
    try {
        // Подготавливаем данные для сохранения
        const totalAmount = itemsData.reduce((sum, item) => sum + item.total, 0);
        
        const calculationData = {
            name: calculationName,
            type: 'cost',
            amount: totalAmount,
            details: {
                items: itemsData.map(item => ({
                    materialId: item.materialId,
                    priceId: item.priceId,
                    name: item.name,
                    length: item.length,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
            }
        };
        
        // Сохраняем расчет
        await api.calculations.create(calculationData);
        
        alert('Расчет успешно сохранен');
        
        // Сбрасываем форму
        document.getElementById('calculationName').value = '';
        itemsData = [];
        updateCalculationTable();
    } catch (error) {
        console.error('Ошибка при сохранении расчета:', error);
        alert(error.message || 'Ошибка при сохранении расчета');
    }
}

/**
 * Печать расчета
 */
function printCalculation() {
    if (itemsData.length === 0) {
        alert('Добавьте хотя бы один товар для печати расчета');
        return;
    }
    
    const calculationName = document.getElementById('calculationName').value || 'Расчет стоимости';
    const totalAmount = itemsData.reduce((sum, item) => sum + item.total, 0);
    
    const printContent = `
        <html>
        <head>
            <title>${calculationName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2B5DA2; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .text-right { text-align: right; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>${calculationName}</h1>
            <table>
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Название материала</th>
                        <th>Ед. изм.</th>
                        <th>Длина, м</th>
                        <th>Кол-во, шт</th>
                        <th>Цена за м², ₽</th>
                        <th>Сумма, ₽</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsData.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.name} (${item.coating}, ${item.thickness} мм)</td>
                            <td>${item.unit}</td>
                            <td>${item.length}</td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="6" class="text-right"><strong>Итого:</strong></td>
                        <td><strong>${formatCurrency(totalAmount)} ₽</strong></td>
                    </tr>
                </tfoot>
            </table>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}