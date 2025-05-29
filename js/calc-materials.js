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
            if (fenceMaterialType.value === 'proflist') {
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
            if (roofType.value === 'single') {
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
            const wallHtml = `
                <div class="wall-item" id="wall${wallCount}">
                    <div class="wall-header">
                        <h4>Стена ${wallCount}</h4>
                        <button class="btn btn-danger btn-sm delete-wall" data-wall="${wallCount}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Длина, м</label>
                            <input type="number" class="wall-length" min="0.1" step="0.1">
                        </div>
                        <div class="form-group">
                            <label>Высота, м</label>
                            <input type="number" class="wall-height" min="0.1" step="0.1">
                        </div>
                    </div>
                </div>
            `;
            
            wallsContainer.insertAdjacentHTML('beforeend', wallHtml);
            
            // Добавляем обработчик для кнопки удаления
            const deleteBtn = wallsContainer.querySelector(`#wall${wallCount} .delete-wall`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    const wallId = e.target.closest('.delete-wall').getAttribute('data-wall');
                    const wallElement = document.getElementById(`wall${wallId}`);
                    if (wallElement) {
                        wallElement.remove();
                    }
                });
            }
        });
    }
}

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

        // Инициализируем начальные значения для крыши и обшивки
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
 * Инициализация обработчиков изменения типа материала
 */
function initMaterialTypeHandlers() {
    const materialSelects = ['proflistType', 'stakeType', 'roofSubtype', 'sidingSubtype'];
    
    materialSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', () => {
                const type = selectId.replace('Type', '').replace('Subtype', '');
                updateCoatingOptions(type);
            });
        }
    });
}

/**
 * Обновление опций покрытия
 */
function updateCoatingOptions(materialType) {
    const coatingSelect = document.getElementById(`${materialType}Coating`);
    if (!coatingSelect) return;
    
    const materialSelect = document.getElementById(`${materialType}Type`) || 
                         document.getElementById(`${materialType}Subtype`);
    if (!materialSelect) return;
    
    const materialId = materialSelect.value;
    if (!materialId) return;
    
    // Находим все цены для выбранного материала
    const prices = priceListData.filter(p => p.materialId === materialId);
    
    // Создаем уникальные комбинации покрытия и толщины
    const options = prices.map(p => ({
        coating: p.coating,
        thickness: p.thickness,
        price: p.price
    }));
    
    // Обновляем список покрытий
    coatingSelect.innerHTML = options.map(option => 
        `<option value="${option.coating}" data-thickness="${option.thickness}" data-price="${option.price}">
            ${option.coating}, ${option.thickness} мм - ${formatCurrency(option.price)} ₽/м²
        </option>`
    ).join('');
}

/**
 * Обновление подтипов материала
 */
function updateMaterialSubtypes(section, materialType) {
    const subtypeSelect = document.getElementById(`${section}Subtype`);
    if (!subtypeSelect) return;
    
    let categoryId;
    switch (materialType) {
        case 'metalTile':
            categoryId = 2; // ID категории металлочерепицы
            break;
        case 'proflist':
            categoryId = 1; // ID категории профлиста
            break;
        case 'siding':
            categoryId = 4; // ID категории сайдинга
            break;
    }
    
    if (categoryId) {
        const materials = materialsData.filter(m => m.category_id === categoryId);
        subtypeSelect.innerHTML = materials.map(m =>
            `<option value="${m.id}">${m.name}</option>`
        ).join('');
        
        updateCoatingOptions(section);
    }
}

/**
 * Расчет материалов
 */
function calculateMaterials() {
    const activeTab = document.querySelector('.calculation-tabs .tab-btn.active');
    if (!activeTab) return;
    
    const calculationType = activeTab.getAttribute('data-tab');
    let results = [];
    
    switch (calculationType) {
        case 'fence':
            results = calculateFenceMaterials();
            break;
        case 'roof':
            results = calculateRoofMaterials();
            break;
        case 'siding':
            results = calculateSidingMaterials();
            break;
    }
    
    calculationResults = results;
    updateResultsTable();
}

// Остальные функции (calculateFenceMaterials, calculateRoofMaterials, calculateSidingMaterials)
// остаются без изменений, так как они не связаны с проблемой покрытий и толщин

/**
 * Обновление таблицы результатов
 */
function updateResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    const totalElement = document.getElementById('totalAmount');
    
    if (!tbody || !totalElement) return;
    
    tbody.innerHTML = '';
    
    if (calculationResults.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Нет результатов расчета</td>
            </tr>
        `;
        totalElement.textContent = '0.00 ₽';
        return;
    }
    
    let totalAmount = 0;
    
    calculationResults.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.length || '-'}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)} ₽</td>
            <td>${formatCurrency(item.total)} ₽</td>
        `;
        tbody.appendChild(row);
        totalAmount += item.total;
    });
    
    totalElement.textContent = `${formatCurrency(totalAmount)} ₽`;
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
    // Реализация функции печати остается без изменений
}