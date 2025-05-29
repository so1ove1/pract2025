/**
 * calc-materials.js - Скрипт для страницы расчета материалов
 */

import { api, formatCurrency } from './main.js';

// Глобальные переменные
let materialsData = []; // Материалы
let priceListData = []; // Прайс-лист
let calculationResults = []; // Результаты расчета

document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка данных
    await loadMaterialsData();

    // Настройка переключения вкладок
    initTabs();

    // Настройка переключения типа материала для забора
    initFenceMaterialToggle();

    // Настройка переключения типа крыши
    initRoofTypeToggle();

    // Настройка кнопки добавления стены
    initAddWallButton();

    // Кнопка расчета
    const calculateBtn = document.getElementById('calculateMaterialsBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateMaterials);
    }

    // Кнопка сохранения
    const saveBtn = document.getElementById('saveMaterialCalculationBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCalculation);
    }

    // Кнопка печати
    const printBtn = document.getElementById('printCalculationBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printCalculation);
    }

    // Настройка обработчиков изменения типа материала
    initMaterialTypeHandlers();
});

/**
 * Загрузка данных о материалах и ценах
 */
async function loadMaterialsData() {
    try {
        materialsData = await api.materials.getAll();
        priceListData = await api.prices.getAll();

        // Заполняем селекты для профлиста
        const proflistSelect = document.getElementById('proflistType');
        if (proflistSelect) {
            const proflistMaterials = materialsData.filter(m => m.category_id === 1);
            proflistSelect.innerHTML = proflistMaterials.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
            updateCoatingOptions('proflist');
        }

        // Заполняем селекты для штакетника
        const stakeSelect = document.getElementById('stakeType');
        if (stakeSelect) {
            const stakeMaterials = materialsData.filter(m => m.category_id === 3);
            stakeSelect.innerHTML = stakeMaterials.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
            updateCoatingOptions('stake');
        }

        // Инициализируем начальные значения
        const roofMaterialType = document.getElementById('roofMaterialType');
        const sidingMaterialType = document.getElementById('sidingMaterialType');

        if (roofMaterialType) {
            updateMaterialSubtypes('roof', roofMaterialType.value);
        }

        if (sidingMaterialType) {
            updateMaterialSubtypes('siding', sidingMaterialType.value);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

/**
 * Инициализация вкладок
 */
function initTabs() {
    const tabs = document.querySelectorAll('.calculation-tabs .tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab') + 'Tab';
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

/**
 * Инициализация переключения типа материала для забора
 */
function initFenceMaterialToggle() {
    const fenceMaterialType = document.getElementById('fenceMaterialType');
    const proflistForm = document.getElementById('proflistForm');
    const stakeForm = document.getElementById('stakeForm');
    
    if (fenceMaterialType && proflistForm && stakeForm) {
        fenceMaterialType.addEventListener('change', () => {
            const selectedType = fenceMaterialType.value;
            
            if (selectedType === 'proflist') {
                proflistForm.classList.remove('hidden');
                stakeForm.classList.add('hidden');
            } else {
                proflistForm.classList.add('hidden');
                stakeForm.classList.remove('hidden');
            }
        });
    }
}

/**
 * Инициализация переключения типа крыши
 */
function initRoofTypeToggle() {
    const roofType = document.getElementById('roofType');
    const singleRoofParams = document.getElementById('singleRoofParams');
    const doubleRoofParams = document.getElementById('doubleRoofParams');
    
    if (roofType && singleRoofParams && doubleRoofParams) {
        roofType.addEventListener('change', () => {
            const selectedType = roofType.value;
            
            if (selectedType === 'single') {
                singleRoofParams.classList.remove('hidden');
                doubleRoofParams.classList.add('hidden');
            } else {
                singleRoofParams.classList.add('hidden');
                doubleRoofParams.classList.remove('hidden');
            }
        });
    }
}

/**
 * Инициализация кнопки добавления стены
 */
function initAddWallButton() {
    const addWallBtn = document.getElementById('addWallBtn');
    const wallsContainer = document.getElementById('wallsContainer');
    let wallCount = 0;
    
    if (addWallBtn && wallsContainer) {
        addWallBtn.addEventListener('click', () => {
            wallCount++;
            
            const wallDiv = document.createElement('div');
            wallDiv.className = 'wall-item';
            wallDiv.innerHTML = `
                <div class="wall-header">
                    <h4>Стена ${wallCount}</h4>
                    <button class="btn btn-danger remove-wall" data-wall="${wallCount}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Длина стены, м</label>
                        <input type="number" class="wall-length" min="0.1" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Высота стены, м</label>
                        <input type="number" class="wall-height" min="0.1" step="0.1">
                    </div>
                </div>
            `;
            
            wallsContainer.appendChild(wallDiv);
            
            // Добавляем обработчик для кнопки удаления
            const removeBtn = wallDiv.querySelector('.remove-wall');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    wallDiv.remove();
                });
            }
        });
    }
}

/**
 * Обновление опций покрытия
 */
function updateCoatingOptions(materialType) {
    const coatingSelect = document.getElementById(`${materialType}Coating`);
    if (!coatingSelect) return;
    
    const materialSelect = document.getElementById(`${materialType}Type`);
    if (!materialSelect) return;
    
    const materialId = materialSelect.value;
    const prices = priceListData.filter(p => p.materialId === materialId);
    
    // Получаем уникальные покрытия
    const uniqueCoatings = [...new Set(prices.map(p => p.coating))];
    
    coatingSelect.innerHTML = uniqueCoatings.map(coating =>
        `<option value="${coating}">${coating}</option>`
    ).join('');
}

/**
 * Обновление подтипов материала
 */
function updateMaterialSubtypes(section, materialType) {
    const subtypeSelect = document.getElementById(`${section}Subtype`);
    if (!subtypeSelect) return;
    
    const materials = materialsData.filter(m => {
        if (materialType === 'metalTile') return m.category_id === 2;
        if (materialType === 'proflist') return m.category_id === 1;
        if (materialType === 'siding') return m.category_id === 4;
        return false;
    });
    
    subtypeSelect.innerHTML = materials.map(m =>
        `<option value="${m.id}">${m.name}</option>`
    ).join('');
    
    // Обновляем покрытия для выбранного подтипа
    updateCoatingOptions(section);
}

/**
 * Инициализация обработчиков изменения типа материала
 */
function initMaterialTypeHandlers() {
    const roofMaterialType = document.getElementById('roofMaterialType');
    const sidingMaterialType = document.getElementById('sidingMaterialType');
    
    if (roofMaterialType) {
        roofMaterialType.addEventListener('change', () => {
            updateMaterialSubtypes('roof', roofMaterialType.value);
        });
    }
    
    if (sidingMaterialType) {
        sidingMaterialType.addEventListener('change', () => {
            updateMaterialSubtypes('siding', sidingMaterialType.value);
        });
    }
}

/**
 * Расчет материалов
 */
function calculateMaterials() {
    const activeTab = document.querySelector('.calculation-tabs .tab-btn.active');
    if (!activeTab) return;
    
    const calculationType = activeTab.getAttribute('data-tab');
    calculationResults = [];
    
    switch (calculationType) {
        case 'fence':
            calculateFence();
            break;
        case 'roof':
            calculateRoof();
            break;
        case 'siding':
            calculateSiding();
            break;
    }
    
    updateResultsTable();
}

/**
 * Расчет забора
 */
function calculateFence() {
    const fenceMaterialType = document.getElementById('fenceMaterialType');
    
    if (fenceMaterialType.value === 'proflist') {
        calculateProflistFence();
    } else {
        calculateStakeFence();
    }
}

/**
 * Расчет забора из профлиста
 */
function calculateProflistFence() {
    const materialId = document.getElementById('proflistType').value;
    const coating = document.getElementById('proflistCoating').value;
    const length = parseFloat(document.getElementById('fenceLength').value);
    const height = parseFloat(document.getElementById('fenceHeight').value);
    
    if (!materialId || !coating || !length || !height) {
        alert('Заполните все поля для расчета');
        return;
    }
    
    const material = materialsData.find(m => m.id === materialId);
    const price = priceListData.find(p => 
        p.materialId === materialId && 
        p.coating === coating
    );
    
    if (!material || !price) {
        alert('Ошибка при получении данных о материале');
        return;
    }
    
    const area = length * height;
    const sheetsCount = Math.ceil(length / material.working_width);
    const totalPrice = area * price.price;
    
    calculationResults.push({
        name: `${material.name} (${coating})`,
        unit: material.unit,
        length,
        quantity: sheetsCount,
        price: price.price,
        total: totalPrice
    });
}

/**
 * Расчет забора из штакетника
 */
function calculateStakeFence() {
    const materialId = document.getElementById('stakeType').value;
    const coating = document.getElementById('stakeCoating').value;
    const length = parseFloat(document.getElementById('stakeFenceLength').value);
    const height = parseFloat(document.getElementById('stakeFenceHeight').value);
    const spacing = parseFloat(document.getElementById('stakeSpacing').value);
    
    if (!materialId || !coating || !length || !height || isNaN(spacing)) {
        alert('Заполните все поля для расчета');
        return;
    }
    
    const material = materialsData.find(m => m.id === materialId);
    const price = priceListData.find(p => 
        p.materialId === materialId && 
        p.coating === coating
    );
    
    if (!material || !price) {
        alert('Ошибка при получении данных о материале');
        return;
    }
    
    const stakeWidth = material.working_width;
    const stakesCount = Math.ceil(length / (stakeWidth + spacing / 1000));
    const totalPrice = stakesCount * height * price.price;
    
    calculationResults.push({
        name: `${material.name} (${coating})`,
        unit: material.unit,
        length: height,
        quantity: stakesCount,
        price: price.price,
        total: totalPrice
    });
}

/**
 * Обновление таблицы результатов
 */
function updateResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!tbody || !totalAmount) return;
    
    tbody.innerHTML = '';
    
    if (calculationResults.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Нет данных для отображения</td>
            </tr>
        `;
        totalAmount.textContent = '0.00 ₽';
        return;
    }
    
    let total = 0;
    
    calculationResults.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.length}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.total)}</td>
        `;
        tbody.appendChild(row);
        total += item.total;
    });
    
    totalAmount.textContent = formatCurrency(total) + ' ₽';
}

/**
 * Сохранение расчета
 */
async function saveCalculation() {
    const calculationName = document.getElementById('calculationMaterialName').value;
    
    if (!calculationName) {
        alert('Введите название расчета');
        return;
    }
    
    if (calculationResults.length === 0) {
        alert('Нет данных для сохранения');
        return;
    }
    
    try {
        const activeTab = document.querySelector('.calculation-tabs .tab-btn.active');
        if (!activeTab) return;
        
        const calculationType = 'materials-' + activeTab.getAttribute('data-tab');
        const totalAmount = calculationResults.reduce((sum, item) => sum + item.total, 0);
        
        const calculationData = {
            name: calculationName,
            type: calculationType,
            amount: totalAmount,
            details: {
                items: calculationResults
            }
        };
        
        await api.calculations.create(calculationData);
        alert('Расчет успешно сохранен');
        
        // Очищаем форму
        document.getElementById('calculationMaterialName').value = '';
        calculationResults = [];
        updateResultsTable();
    } catch (error) {
        console.error('Ошибка при сохранении расчета:', error);
        alert(error.message || 'Ошибка при сохранении расчета');
    }
}

/**
 * Печать расчета
 */
function printCalculation() {
    if (calculationResults.length === 0) {
        alert('Нет данных для печати');
        return;
    }
    
    const calculationName = document.getElementById('calculationMaterialName').value || 'Расчет материалов';
    const totalAmount = calculationResults.reduce((sum, item) => sum + item.total, 0);
    
    const printContent = `
        <html>
        <head>
            <title>Расчет материалов - ${calculationName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2B5DA2; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>ООО «Братск Профиль»</h1>
            <h2>${calculationName}</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Название материала</th>
                        <th>Ед. изм.</th>
                        <th>Длина, м</th>
                        <th>Кол-во, шт</th>
                        <th>Цена, ₽</th>
                        <th>Сумма, ₽</th>
                    </tr>
                </thead>
                <tbody>
                    ${calculationResults.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.name}</td>
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
                        <td colspan="6" class="total">Итого:</td>
                        <td class="total">${formatCurrency(totalAmount)} ₽</td>
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