/**
 * calc-materials.js - Скрипт для страницы расчета материалов
 */

import { api, formatCurrency } from './main.js';

// Глобальные переменные
let materialsData = []; // Материалы
let priceListData = []; // Прайс-лист
let calculationResults = []; // Результаты расчета

// Вспомогательная функция для округления
function customRound(value) {
    const diff = value - Math.floor(value);
    return diff <= 0.1 ? Math.floor(value) : Math.ceil(value);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка данных
    await loadMaterialsData();

    // Настройка переключения вкладок
    initTabs();

    // Настройка переключения типа материала для забора
    initFenceMaterialToggle();

    // Настройка переключения типа крыши
    initRoofTypeToggle();

    // Настройка чекбокса для второго ската
    initSecondSlopeToggle();

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

    // Инициализация начальных значений для крыши
    const roofMaterialType = document.getElementById('roofMaterialType');
    if (roofMaterialType) {
        updateMaterialSubtypes('roof', roofMaterialType.value);
    }
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
 * Инициализация чекбокса для второго ската
 */
function initSecondSlopeToggle() {
    const useSecondSlope = document.getElementById('useSecondSlope');
    const secondSlopeParams = document.getElementById('secondSlopeParams');

    if (useSecondSlope && secondSlopeParams) {
        useSecondSlope.addEventListener('change', () => {
            secondSlopeParams.classList.toggle('hidden', !useSecondSlope.checked);
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
    // Обработчики для изменения типа материала
    const materialTypeSelects = {
        'roofMaterialType': 'roof',
        'sidingMaterialType': 'siding'
    };

    Object.entries(materialTypeSelects).forEach(([selectId, section]) => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', (e) => {
                updateMaterialSubtypes(section, e.target.value);
            });
        }
    });

    // Обработчики для изменения подтипа материала
    const subtypeSelects = {
        'proflistType': 'proflist',
        'stakeType': 'stake',
        'roofSubtype': 'roof',
        'sidingSubtype': 'siding'
    };

    Object.entries(subtypeSelects).forEach(([selectId, section]) => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', () => {
                updateCoatingOptions(section);
            });
        }
    });
}

/**
 * Обновление опций покрытия
 */
function updateCoatingOptions(section) {
    const materialSelect = document.getElementById(`${section}Type`) ||
        document.getElementById(`${section}Subtype`);
    const coatingSelect = document.getElementById(`${section}Coating`);

    if (!materialSelect || !coatingSelect) return;

    const materialId = materialSelect.value;
    if (!materialId) return;

    // Находим материал
    const material = materialsData.find(m => m.id === parseInt(materialId));
    if (!material) return;

    // Находим все цены для выбранного материала
    const prices = priceListData.filter(p => p.materialId === parseInt(materialId));

    // Создаем уникальные комбинации покрытия и толщины
    const options = prices.map(p => ({
        id: p.id,
        coating: p.coating,
        thickness: p.thickness,
        price: p.price,
        text: `${p.coating}, ${p.thickness} мм - ${formatCurrency(p.price)} ₽/${material.unit}`
    }));

    // Сортируем опции
    options.sort((a, b) => {
        if (a.coating === b.coating) {
            return a.thickness - b.thickness;
        }
        return a.coating.localeCompare(b.coating);
    });

    // Обновляем список покрытий
    coatingSelect.innerHTML = options.map(option =>
        `<option value="${option.id}" 
            data-coating="${option.coating}"
            data-thickness="${option.thickness}"
            data-price="${option.price}">
            ${option.text}
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

/**
 * Расчет материалов для забора
 */
function calculateFenceMaterials() {
    const results = [];
    const fenceMaterialType = document.getElementById('fenceMaterialType').value;

    if (fenceMaterialType === 'proflist') {
        // Расчет для профлиста
        const materialId = document.getElementById('proflistType').value;
        const priceId = document.getElementById('proflistCoating').value;
        const length = parseFloat(document.getElementById('fenceLength').value);
        const height = parseFloat(document.getElementById('fenceHeight').value);

        if (!materialId || !priceId || !length || !height) {
            alert('Заполните все поля для расчета');
            return [];
        }

        const material = materialsData.find(m => m.id === parseInt(materialId));
        const priceOption = priceListData.find(p => p.id === parseInt(priceId));

        if (!material || !priceOption) return [];

        // x = длину забора / монтажная ширина профлиста
        const sheetsCount = customRound(length / material.working_width);

        results.push({
            materialId: parseInt(materialId),
            priceId: parseInt(priceId),
            name: `${material.name} (${priceOption.coating}, ${priceOption.thickness} мм)`,
            unit: material.unit,
            length: height,
            quantity: sheetsCount,
            pricePerM2: priceOption.price,
            price: priceOption.price * material.overall_width * height,
            total: priceOption.price * material.overall_width * height * sheetsCount,
            overallWidth: material.overall_width,
            workingWidth: material.working_width
        });
    } else {
        // Расчет для штакетника
        const materialId = document.getElementById('stakeType').value;
        const priceId = document.getElementById('stakeCoating').value;
        const length = parseFloat(document.getElementById('stakeFenceLength').value);
        const height = parseFloat(document.getElementById('stakeFenceHeight').value);
        const spacing = parseFloat(document.getElementById('stakeSpacing').value);

        if (!materialId || !priceId || !length || !height || isNaN(spacing)) {
            alert('Заполните все поля для расчета');
            return [];
        }

        const material = materialsData.find(m => m.id === parseInt(materialId));
        const priceOption = priceListData.find(p => p.id === parseInt(priceId));

        if (!material || !priceOption) return [];

        // x = ([длина забора / (ширина габаритная штакетины + расстояние между деталями)]-округлить + 1)
        const stakesCount = customRound(length / ((material.overall_width + spacing) / 1000)) + 1;

        results.push({
            materialId: parseInt(materialId),
            priceId: parseInt(priceId),
            name: `${material.name} (${priceOption.coating}, ${priceOption.thickness} мм)`,
            unit: material.unit,
            length: height,
            quantity: stakesCount,
            pricePerM2: priceOption.price,
            price: priceOption.price * material.overall_width * height,
            total: priceOption.price * material.overall_width * height * stakesCount,
            overallWidth: material.overall_width,
            workingWidth: material.working_width
        });
    }

    return results;
}

/**
 * Расчет материалов для крыши
 */
function calculateRoofMaterials() {
    const results = [];
    const roofType = document.getElementById('roofType').value;
    const materialId = document.getElementById('roofSubtype').value;
    const priceId = document.getElementById('roofCoating').value;
    const useSecondSlope = document.getElementById('useSecondSlope').checked;

    if (!materialId || !priceId) {
        alert('Выберите материал и покрытие');
        return [];
    }

    const material = materialsData.find(m => m.id === parseInt(materialId));
    const priceOption = priceListData.find(p => p.id === parseInt(priceId));

    if (!material || !priceOption) return [];

    let length1, width1, length2, width2;

    if (roofType === 'single') {
        length1 = parseFloat(document.getElementById('singleRoofLength').value);
        width1 = parseFloat(document.getElementById('singleRoofWidth').value);

        if (!length1 || !width1) {
            alert('Заполните размеры ската');
            return [];
        }

        // x = (ширина крыши / монтажная ширина материала)
        const sheetsCount = customRound(width1 / material.working_width);

        results.push({
            materialId: parseInt(materialId),
            priceId: parseInt(priceId),
            name: `${material.name} (${priceOption.coating}, ${priceOption.thickness} мм)`,
            unit: material.unit,
            length: length1,
            quantity: sheetsCount,
            pricePerM2: priceOption.price,
            price: priceOption.price * material.overall_width * length1,
            total: priceOption.price * material.overall_width * length1 * sheetsCount,
            overallWidth: material.overall_width,
            workingWidth: material.working_width
        });
    } else {
        length1 = parseFloat(document.getElementById('doubleRoofLength1').value);
        width1 = parseFloat(document.getElementById('doubleRoofWidth1').value);

        if (!length1 || !width1) {
            alert('Заполните размеры первого ската');
            return [];
        }

        // Расчет для первого ската
        const sheetsCount1 = customRound(width1 / material.working_width);
        results.push({
            materialId: parseInt(materialId),
            priceId: parseInt(priceId),
            name: `${material.name} (${priceOption.coating}, ${priceOption.thickness} мм) - Скат 1`,
            unit: material.unit,
            length: length1,
            quantity: sheetsCount1,
            pricePerM2: priceOption.price,
            price: priceOption.price * material.overall_width * length1,
            total: priceOption.price * material.overall_width * length1 * sheetsCount1,
            overallWidth: material.overall_width,
            workingWidth: material.working_width
        });

        // Расчет для второго ската
        if (useSecondSlope) {
            length2 = parseFloat(document.getElementById('doubleRoofLength2').value) || length1;
            width2 = parseFloat(document.getElementById('doubleRoofWidth2').value) || width1;
        } else {
            length2 = length1;
            width2 = width1;
        }

        const sheetsCount2 = customRound(width2 / material.working_width);
        results.push({
            materialId: parseInt(materialId),
            priceId: parseInt(priceId),
            name: `${material.name} (${priceOption.coating}, ${priceOption.thickness} мм) - Скат 2`,
            unit: material.unit,
            length: length2,
            quantity: sheetsCount2,
            pricePerM2: priceOption.price,
            price: priceOption.price * material.overall_width * length2,
            total: priceOption.price * material.overall_width * length2 * sheetsCount2,
            overallWidth: material.overall_width,
            workingWidth: material.working_width
        });
    }

    return results;
}

/**
 * Расчет материалов для обшивки
 */
function calculateSidingMaterials() {
    const results = [];
    const materialType = document.getElementById('sidingMaterialType').value;
    const materialId = document.getElementById('sidingSubtype').value;
    const priceId = document.getElementById('sidingCoating').value;

    if (!materialId || !priceId) {
        alert('Выберите материал и покрытие');
        return [];
    }

    const material = materialsData.find(m => m.id === parseInt(materialId));
    const priceOption = priceListData.find(p => p.id === parseInt(priceId));

    if (!material || !priceOption) return [];

    const walls = document.querySelectorAll('.wall-item');
    if (walls.length === 0) {
        alert('Добавьте хотя бы одну стену');
        return [];
    }

    walls.forEach((wall, index) => {
        const width = parseFloat(wall.querySelector('.wall-length').value);
        const height = parseFloat(wall.querySelector('.wall-height').value);

        if (!width || !height) {
            alert(`Заполните размеры стены ${index + 1}`);
            return;
        }

        let sheetsCount, length;

        if (materialType === 'proflist') {
            // x = (ширина стены / ширина монтажная)
            sheetsCount = customRound(width / material.working_width);
            length = height;
        } else { // сайдинг
            // x = (высота стены / ширина монтажная)
            sheetsCount = customRound(height / material.working_width);
            length = width;
        }

        results.push({
            materialId: parseInt(materialId),
            priceId: parseInt(priceId),
            name: `${material.name} (${priceOption.coating}, ${priceOption.thickness} мм) - Стена ${index + 1}`,
            unit: material.unit,
            length: length,
            quantity: sheetsCount,
            pricePerM2: priceOption.price,
            price: priceOption.price * material.overall_width * length,
            total: priceOption.price * material.overall_width * length * sheetsCount,
            overallWidth: material.overall_width,
            workingWidth: material.working_width
        });
    });

    return results;
}

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
                <td colspan="8" class="text-center">Нет результатов расчета</td>
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
            <td>
                <input type="number" class="length-input" value="${item.length}" 
                    min="0.1" step="0.1" data-index="${index}">
            </td>
            <td>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                    min="1" step="1" data-index="${index}">
            </td>
            <td>
                <input type="number" class="price-input" value="${item.pricePerM2}" 
                    min="0.01" step="0.01" data-index="${index}">
            </td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.total)}</td>
        `;
        tbody.appendChild(row);
        totalAmount += item.total;
    });

    // Добавляем обработчики для изменения длины, количества и цены
    const lengthInputs = tbody.querySelectorAll('.length-input');
    const quantityInputs = tbody.querySelectorAll('.quantity-input');
    const priceInputs = tbody.querySelectorAll('.price-input');

    lengthInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const length = parseFloat(input.value);
            
            if (length <= 0 || isNaN(length)) {
                input.value = calculationResults[index].length;
                return;
            }
            
            calculationResults[index].length = length;
            calculationResults[index].price = calculationResults[index].pricePerM2 * calculationResults[index].overallWidth * length;
            calculationResults[index].total = calculationResults[index].price * calculationResults[index].quantity;
            updateResultsTable();
        });
    });

    quantityInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const quantity = parseInt(input.value);
            
            if (quantity <= 0 || isNaN(quantity)) {
                input.value = calculationResults[index].quantity;
                return;
            }
            
            calculationResults[index].quantity = quantity;
            calculationResults[index].total = calculationResults[index].price * quantity;
            updateResultsTable();
        });
    });

    priceInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const price = parseFloat(input.value);
            
            if (price <= 0 || isNaN(price)) {
                input.value = calculationResults[index].pricePerM2;
                return;
            }
            
            calculationResults[index].pricePerM2 = price;
            calculationResults[index].price = price * calculationResults[index].overallWidth * calculationResults[index].length;
            calculationResults[index].total = calculationResults[index].price * calculationResults[index].quantity;
            updateResultsTable();
        });
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
                items: calculationResults.map(item => ({
                    materialId: item.materialId,
                    priceId: item.priceId,
                    name: item.name,
                    unit: item.unit,
                    length: item.length,
                    quantity: item.quantity,
                    pricePerM2: item.pricePerM2,
                    price: item.price,
                    total: item.total,
                    overallWidth: item.overallWidth,
                    workingWidth: item.workingWidth
                }))
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
            <title>${calculationName}</title>
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
            <h1>${calculationName}</h1>
            <table>
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Материал</th>
                        <th>Ед. изм.</th>
                        <th>Длина, м</th>
                        <th>Количество</th>
                        <th>Цена за м², ₽</th>
                        <th>Цена за шт., ₽</th>
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
                            <td>${formatCurrency(item.pricePerM2)}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="7" class="total">Итого:</td>
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