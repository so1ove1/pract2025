/**
 * calc-materials.js - Скрипт для страницы расчета материалов
 */

import { fetchData, formatCurrency } from './main.js';


function customRound(value) {
    const diff = value - Math.trunc(value);
    return diff <= 0.1 ? Math.floor(value) : Math.ceil(value);
}

// Глобальные переменные
let materialsData = []; // Материалы
let priceListData = []; // Прайс-лист
let calculationResults = []; // Результаты расчета

document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка данных
    await loadMaterialsData();

    // Настройка переключения вкладок
    setupTabs();

    // Настройка переключения типа материала для забора
    setupFenceMaterialToggle();

    // Настройка переключения типа крыши
    setupRoofTypeToggle();

    // Настройка кнопки добавления стены
    setupAddWallButton();

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
    setupMaterialTypeHandlers();
});

/**
 * Настройка переключения вкладок
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.calculation-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to selected button and pane
            button.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}


/**
 * Загрузка данных о материалах и ценах
 */
async function loadMaterialsData() {
    try {
        materialsData = await fetchData('materials');
        priceListData = await fetchData('pricelist');

        // Заполняем селекты для профлиста
        const proflistSelect = document.getElementById('proflistType');
        if (proflistSelect) {
            const proflistMaterials = materialsData.filter(m => m.categoryId === 1);
            proflistSelect.innerHTML = proflistMaterials.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
            updateCoatingSelect('proflist');
        }

        // Заполняем селекты для штакетника
        const stakeSelect = document.getElementById('stakeType');
        if (stakeSelect) {
            const stakeMaterials = materialsData.filter(m => m.categoryId === 3);
            stakeSelect.innerHTML = stakeMaterials.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
            updateCoatingSelect('stake');
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
 * Настройка обработчиков изменения типа материала
 */
function setupMaterialTypeHandlers() {
    // Обработчик для крыши
    const roofMaterialType = document.getElementById('roofMaterialType');
    if (roofMaterialType) {
        roofMaterialType.addEventListener('change', () => {
            updateMaterialSubtypes('roof', roofMaterialType.value);
        });
    }

    // Обработчик для обшивки
    const sidingMaterialType = document.getElementById('sidingMaterialType');
    if (sidingMaterialType) {
        sidingMaterialType.addEventListener('change', () => {
            updateMaterialSubtypes('siding', sidingMaterialType.value);
        });
    }

    // Обработчики для изменения подтипа материала
    const roofSubtype = document.getElementById('roofSubtype');
    const sidingSubtype = document.getElementById('sidingSubtype');

    if (roofSubtype) {
        roofSubtype.addEventListener('change', () => updateCoatingSelect('roof'));
    }

    if (sidingSubtype) {
        sidingSubtype.addEventListener('change', () => updateCoatingSelect('siding'));
    }

    // Обработчики для профлиста и штакетника
    const proflistType = document.getElementById('proflistType');
    const stakeType = document.getElementById('stakeType');

    if (proflistType) {
        proflistType.addEventListener('change', () => updateCoatingSelect('proflist'));
    }

    if (stakeType) {
        stakeType.addEventListener('change', () => updateCoatingSelect('stake'));
    }
}

/**
 * Обновление списка подтипов материала
 */
function updateMaterialSubtypes(section, materialType) {
    let categoryId;
    let subtypeSelect;

    switch (section) {
        case 'roof':
            categoryId = materialType === 'metalTile' ? 2 : 1;
            subtypeSelect = document.getElementById('roofSubtype');
            break;
        case 'siding':
            categoryId = materialType === 'proflist' ? 1 : 4;
            subtypeSelect = document.getElementById('sidingSubtype');
            break;
        default:
            return;
    }

    if (!subtypeSelect) return;

    const materials = materialsData.filter(m => m.categoryId === categoryId);

    subtypeSelect.innerHTML = materials.map(m =>
        `<option value="${m.id}">${m.name}</option>`
    ).join('');

    // Обновляем список покрытий для нового подтипа
    updateCoatingSelect(section);
}

/**
 * Обновление списка покрытий в зависимости от выбранного материала
 */
function updateCoatingSelect(type) {
    let materialId, coatingSelect;

    switch (type) {
        case 'proflist':
            const proflistType = document.getElementById('proflistType');
            coatingSelect = document.getElementById('proflistCoating');
            if (proflistType) materialId = parseInt(proflistType.value);
            break;
        case 'stake':
            const stakeType = document.getElementById('stakeType');
            coatingSelect = document.getElementById('stakeCoating');
            if (stakeType) materialId = parseInt(stakeType.value);
            break;
        case 'roof':
            const roofSubtype = document.getElementById('roofSubtype');
            coatingSelect = document.getElementById('roofCoating');
            if (roofSubtype) materialId = parseInt(roofSubtype.value);
            break;
        case 'siding':
            const sidingSubtype = document.getElementById('sidingSubtype');
            coatingSelect = document.getElementById('sidingCoating');
            if (sidingSubtype) materialId = parseInt(sidingSubtype.value);
            break;
    }

    if (!materialId || !coatingSelect) return;

    const coatings = priceListData.filter(p => p.materialId === materialId);

    coatingSelect.innerHTML = coatings.map(c =>
        `<option value="${c.id}">${c.coating}, ${c.thickness} мм - ${formatCurrency(c.price)} ₽/м²</option>`
    ).join('');
}

/**
 * Настройка переключения типа материала для забора
 */
function setupFenceMaterialToggle() {
    const fenceMaterialType = document.getElementById('fenceMaterialType');
    const proflistForm = document.getElementById('proflistForm');
    const stakeForm = document.getElementById('stakeForm');

    if (!fenceMaterialType || !proflistForm || !stakeForm) return;

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

/**
 * Настройка переключения типа крыши
 */
function setupRoofTypeToggle() {
    const roofType = document.getElementById('roofType');
    const singleRoofParams = document.getElementById('singleRoofParams');
    const doubleRoofParams = document.getElementById('doubleRoofParams');

    if (!roofType || !singleRoofParams || !doubleRoofParams) return;

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

/**
 * Настройка кнопки добавления стены
 */
function setupAddWallButton() {
    const addWallBtn = document.getElementById('addWallBtn');
    const wallsContainer = document.getElementById('wallsContainer');

    if (!addWallBtn || !wallsContainer) return;

    addWallBtn.addEventListener('click', () => {
        const wallIndex = wallsContainer.children.length + 1;

        const wallElement = document.createElement('div');
        wallElement.className = 'wall-item';
        wallElement.setAttribute('data-wall-index', wallIndex);

        wallElement.innerHTML = `
            <div class="wall-header">
                <h4>Стена ${wallIndex}</h4>
                <button class="btn btn-danger delete-wall-btn">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="wallWidth${wallIndex}">Ширина, м</label>
                    <input type="number" id="wallWidth${wallIndex}" class="wall-width" min="0.5" step="0.1" required>
                </div>
                <div class="form-group">
                    <label for="wallHeight${wallIndex}">Высота, м</label>
                    <input type="number" id="wallHeight${wallIndex}" class="wall-height" min="0.5" step="0.1" required>
                </div>
            </div>
        `;

        const deleteButton = wallElement.querySelector('.delete-wall-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите удалить эту стену?')) {
                    wallElement.remove();
                    renumberWalls();
                }
            });
        }

        wallsContainer.appendChild(wallElement);
    });

    // Добавляем первую стену по умолчанию
    if (wallsContainer.children.length === 0) {
        addWallBtn.click();
    }
}

/**
 * Перенумерация стен после удаления
 */
function renumberWalls() {
    const wallsContainer = document.getElementById('wallsContainer');
    if (!wallsContainer) return;

    const walls = wallsContainer.querySelectorAll('.wall-item');

    walls.forEach((wall, index) => {
        const newIndex = index + 1;
        wall.setAttribute('data-wall-index', newIndex);

        const header = wall.querySelector('h4');
        if (header) {
            header.textContent = `Стена ${newIndex}`;
        }

        const widthInput = wall.querySelector('.wall-width');
        const heightInput = wall.querySelector('.wall-height');

        if (widthInput) {
            widthInput.id = `wallWidth${newIndex}`;
        }

        if (heightInput) {
            heightInput.id = `wallHeight${newIndex}`;
        }
    });
}

/**
 * Расчет материалов
 */
function calculateMaterials() {
    const activeTab = document.querySelector('.calculation-tabs .tab-btn.active');
    if (!activeTab) return;

    const tabId = activeTab.getAttribute('data-tab');
    calculationResults = [];

    switch (tabId) {
        case 'fence':
            calculateFenceMaterials();
            break;
        case 'roof':
            calculateRoofMaterials();
            break;
        case 'siding':
            calculateSidingMaterials();
            break;
    }

    updateResultsTable();
}

/**
 * Обновление таблицы результатов
 */
function updateResultsTable() {
    const tableBody = document.getElementById('resultsTableBody');
    const totalAmountElement = document.getElementById('totalAmount');

    if (!tableBody || !totalAmountElement) return;

    tableBody.innerHTML = '';

    if (calculationResults.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Нет результатов расчета</td></tr>';
        totalAmountElement.textContent = '0.00 ₽';
        return;
    }

    let totalAmount = 0;

    calculationResults.forEach((item, index) => {
        const row = document.createElement('tr');
        totalAmount += item.total;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.length.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.total)}</td>
        `;

        tableBody.appendChild(row);
    });

    totalAmountElement.textContent = `${formatCurrency(totalAmount)} ₽`;
}

/**
 * Расчет материалов для забора
 */
function calculateFenceMaterials() {
    const materialType = document.getElementById('fenceMaterialType');
    if (!materialType) return;

    if (materialType.value === 'proflist') {
        calculateProflistFence();
    } else {
        calculateStakeFence();
    }
}

/**
 * Расчет забора из профлиста
 */
function calculateProflistFence() {
    const proflistType = document.getElementById('proflistType');
    const proflistCoating = document.getElementById('proflistCoating');
    const fenceLength = document.getElementById('fenceLength');
    const fenceHeight = document.getElementById('fenceHeight');

    if (!proflistType || !proflistCoating || !fenceLength || !fenceHeight) return;

    const length = parseFloat(fenceLength.value);
    const height = parseFloat(fenceHeight.value);

    if (!length || !height) {
        alert('Заполните все параметры забора');
        return;
    }

    const material = materialsData.find(m => m.id === parseInt(proflistType.value));
    const priceItem = priceListData.find(p => p.id === parseInt(proflistCoating.value));

    if (!material || !priceItem) return;

    const sheetsCount = customRound(length / material.workingWidth);
    const totalCost = sheetsCount * height * material.overallWidth * priceItem.price;

    calculationResults.push({
        name: `${material.name} (${priceItem.coating}, ${priceItem.thickness} мм)`,
        unit: material.unit,
        length: height,
        quantity: sheetsCount,
        price: priceItem.price,
        total: totalCost
    });
}

/**
 * Расчет забора из штакетника
 */
function calculateStakeFence() {
    const stakeType = document.getElementById('stakeType');
    const stakeCoating = document.getElementById('stakeCoating');
    const fenceLength = document.getElementById('stakeFenceLength');
    const fenceHeight = document.getElementById('stakeFenceHeight');
    const stakeSpacing = document.getElementById('stakeSpacing');

    if (!stakeType || !stakeCoating || !fenceLength || !fenceHeight || !stakeSpacing) return;

    const length = parseFloat(fenceLength.value);
    const height = parseFloat(fenceHeight.value);
    const spacing = parseFloat(stakeSpacing.value);

    if (!length || !height || isNaN(spacing)) {
        alert('Заполните все параметры забора');
        return;
    }

    const material = materialsData.find(m => m.id === parseInt(stakeType.value));
    const priceItem = priceListData.find(p => p.id === parseInt(stakeCoating.value));

    if (!material || !priceItem) return;

    const stakesCount = customRound(length / (material.overallWidth + spacing / 1000));
    const totalCost = stakesCount * height * priceItem.price;

    calculationResults.push({
        name: `${material.name} (${priceItem.coating}, ${priceItem.thickness} мм)`,
        unit: material.unit,
        length: height,
        quantity: stakesCount,
        price: priceItem.price,
        total: totalCost
    });
}

/**
 * Расчет материалов для крыши
 */
function calculateRoofMaterials() {
    const roofType = document.getElementById('roofType');
    const roofSubtype = document.getElementById('roofSubtype');
    const roofCoating = document.getElementById('roofCoating');

    if (!roofType || !roofSubtype || !roofCoating) return;

    let length, width;

    if (roofType.value === 'single') {
        const lengthInput = document.getElementById('singleRoofLength');
        const widthInput = document.getElementById('singleRoofWidth');

        if (!lengthInput || !widthInput) return;

        length = parseFloat(lengthInput.value);
        width = parseFloat(widthInput.value);
    } else {
        const lengthInput = document.getElementById('doubleRoofLength');
        const widthInput = document.getElementById('doubleRoofWidth');

        if (!lengthInput || !widthInput) return;

        length = parseFloat(lengthInput.value);
        width = parseFloat(widthInput.value);
    }

    if (!length || !width) {
        alert('Заполните все параметры крыши');
        return;
    }

    const material = materialsData.find(m => m.id === parseInt(roofSubtype.value));
    const priceItem = priceListData.find(p => p.id === parseInt(roofCoating.value));

    if (!material || !priceItem) return;

    const sheetsCount = customRound(width / material.workingWidth);
    const totalCost = sheetsCount * length * material.overallWidth * priceItem.price;

    calculationResults.push({
        name: `${material.name} (${priceItem.coating}, ${priceItem.thickness} мм)`,
        unit: material.unit,
        length: length,
        quantity: sheetsCount * (roofType.value === 'double' ? 2 : 1),
        price: priceItem.price,
        total: totalCost * (roofType.value === 'double' ? 2 : 1)
    });
}

/**
 * Расчет материалов для обшивки
 */
function calculateSidingMaterials() {
    const sidingMaterialType = document.getElementById('sidingMaterialType');
    const sidingSubtype = document.getElementById('sidingSubtype');
    const sidingCoating = document.getElementById('sidingCoating');
    const wallsContainer = document.getElementById('wallsContainer');

    if (!sidingMaterialType || !sidingSubtype || !sidingCoating || !wallsContainer) return;

    const walls = wallsContainer.querySelectorAll('.wall-item');

    if (walls.length === 0) {
        alert('Добавьте хотя бы одну стену');
        return;
    }

    const material = materialsData.find(m => m.id === parseInt(sidingSubtype.value));
    const priceItem = priceListData.find(p => p.id === parseInt(sidingCoating.value));

    if (!material || !priceItem) return;

    walls.forEach((wall, index) => {
        const widthInput = wall.querySelector('.wall-width');
        const heightInput = wall.querySelector('.wall-height');

        if (!widthInput || !heightInput) return;

        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);

        if (!width || !height) {
            alert(`Заполните размеры стены ${index + 1}`);
            return;
        }

        const sheetsCount = customRound(width / material.workingWidth);
        const totalCost = sheetsCount * height * material.overallWidth * priceItem.price;

        calculationResults.push({
            name: `${material.name} (${priceItem.coating}, ${priceItem.thickness} мм) - Стена \${index + 1}`,
            unit: material.unit,
            length: height,
            quantity: sheetsCount,
            price: priceItem.price,
            total: totalCost
        });
    });
}

/**
 * Сохранение расчета
 */
function saveCalculation() {
    const calculationName = document.getElementById('calculationMaterialName').value;

    if (!calculationName) {
        alert('Введите название расчета');
        return;
    }

    if (calculationResults.length === 0) {
        alert('Нет данных для сохранения');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Необходимо авторизоваться');
        return;
    }

    const activeTab = document.querySelector('.calculation-tabs .tab-btn.active');
    if (!activeTab) return;

    const calculationType = 'materials-' + activeTab.getAttribute('data-tab');
    const totalAmount = calculationResults.reduce((sum, item) => sum + item.total, 0);

    const calculation = {
        id: Date.now(),
        date: new Date().toISOString(),
        name: calculationName,
        type: calculationType,
        userId: currentUser.id,
        amount: totalAmount,
        details: {
            items: calculationResults
        }
    };

    // Сохраняем в localStorage
    let savedCalculations = localStorage.getItem('savedCalculations');
    savedCalculations = savedCalculations ? JSON.parse(savedCalculations) : [];
    savedCalculations.push(calculation);
    localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));

    alert('Расчет успешно сохранен');
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
                .total { font-weight: bold; text-align: right; }
            </style>
        </head>
        <body>
            <h1>ООО «Братск Профиль»</h1>
            <h2>${calculationName}</h2>
            <p>Дата: ${new Date().toLocaleDateString()}</p>
            
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
                            <td>${item.length.toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="6" class="total">Итого:</td>
                        <td>${formatCurrency(totalAmount)} ₽</td>
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