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
 * Загрузка данных материалов
 */
async function loadMaterialsData() {
    try {
        materialsData = await api.materials.getAll();
        priceListData = await api.prices.getAll();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
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
        const pricePerM2 = parseFloat(item.price) || 0;
        const length = parseFloat(item.length) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const overallWidth = parseFloat(item.overallWidth) || 1;
        
        // Расчет цены за штуку (лист)
        const pricePerPiece = pricePerM2 * length * overallWidth;
        
        // Расчет общей суммы
        const total = pricePerPiece * quantity;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${length.toFixed(1)}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(pricePerM2)}</td>
            <td>${formatCurrency(pricePerPiece)}</td>
            <td>${formatCurrency(total)}</td>
        `;
        tbody.appendChild(row);
        totalAmount += total;
    });

    totalElement.textContent = `${formatCurrency(totalAmount)} ₽`;
}

/**
 * Расчет материалов
 */
async function calculateMaterials() {
    const calculationName = document.getElementById('calculationMaterialName').value;
    
    if (!calculationName) {
        alert('Пожалуйста, введите название расчета');
        return;
    }

    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) return;

    calculationResults = [];

    switch (activeTab.id) {
        case 'fenceTab':
            calculateFenceMaterials();
            break;
        case 'roofTab':
            calculateRoofMaterials();
            break;
        case 'sidingTab':
            calculateSidingMaterials();
            break;
    }

    updateResultsTable();
}

/**
 * Расчет материалов для забора
 */
function calculateFenceMaterials() {
    const fenceMaterialType = document.getElementById('fenceMaterialType').value;
    
    if (fenceMaterialType === 'proflist') {
        const proflistType = document.getElementById('proflistType').value;
        const proflistCoating = document.getElementById('proflistCoating').value;
        const fenceLength = parseFloat(document.getElementById('fenceLength').value) || 0;
        const fenceHeight = parseFloat(document.getElementById('fenceHeight').value) || 0;

        if (!fenceLength || !fenceHeight) {
            alert('Введите длину и высоту забора');
            return;
        }

        // Находим материал и цену
        const material = materialsData.find(m => m.id === parseInt(proflistType));
        const price = priceListData.find(p => 
            p.materialId === parseInt(proflistType) && 
            p.coating === proflistCoating
        );

        if (!material || !price) {
            alert('Не удалось найти материал или цену');
            return;
        }

        const workingWidth = parseFloat(material.working_width) || 1;
        const overallWidth = parseFloat(material.overall_width) || 1;
        
        // Расчет количества листов
        const sheetsCount = Math.ceil(fenceLength / workingWidth);

        calculationResults.push({
            name: `${material.name} (${price.coating}, ${price.thickness} мм)`,
            unit: material.unit,
            length: fenceHeight,
            quantity: sheetsCount,
            price: price.price,
            overallWidth: overallWidth,
            workingWidth: workingWidth,
            total: price.price * fenceHeight * overallWidth * sheetsCount
        });
    }
}

/**
 * Расчет материалов для крыши
 */
function calculateRoofMaterials() {
    // Реализация расчета для крыши
    alert('Расчет материалов для крыши находится в разработке');
}

/**
 * Расчет материалов для обшивки
 */
function calculateSidingMaterials() {
    // Реализация расчета для обшивки
    alert('Расчет материалов для обшивки находится в разработке');
}

/**
 * Сохранение расчета
 */
async function saveCalculation() {
    const calculationName = document.getElementById('calculationMaterialName').value;
    
    if (calculationResults.length === 0) {
        alert('Выполните расчет перед сохранением');
        return;
    }

    if (!calculationName) {
        alert('Введите название расчета');
        return;
    }

    try {
        const totalAmount = calculationResults.reduce((sum, item) => 
            sum + (item.price * item.length * item.overallWidth * item.quantity), 0);

        const calculationData = {
            name: calculationName,
            type: 'materials',
            amount: totalAmount,
            details: {
                items: calculationResults
            }
        };

        await api.calculations.create(calculationData);
        alert('Расчет успешно сохранен');

        // Очистка формы
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
        alert('Выполните расчет перед печатью');
        return;
    }

    const calculationName = document.getElementById('calculationMaterialName').value || 'Расчет материалов';
    const totalAmount = calculationResults.reduce((sum, item) => 
        sum + (item.price * item.length * item.overallWidth * item.quantity), 0);

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
                        <th>Цена за шт., ₽</th>
                        <th>Сумма, ₽</th>
                    </tr>
                </thead>
                <tbody>
                    ${calculationResults.map((item, index) => {
                        const pricePerM2 = parseFloat(item.price) || 0;
                        const length = parseFloat(item.length) || 0;
                        const quantity = parseInt(item.quantity) || 0;
                        const overallWidth = parseFloat(item.overallWidth) || 1;
                        const pricePerPiece = pricePerM2 * length * overallWidth;
                        const total = pricePerPiece * quantity;

                        return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.name}</td>
                                <td>${item.unit}</td>
                                <td>${length.toFixed(1)}</td>
                                <td>${quantity}</td>
                                <td>${formatCurrency(pricePerM2)}</td>
                                <td>${formatCurrency(pricePerPiece)}</td>
                                <td>${formatCurrency(total)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="7" class="text-right"><strong>Итого:</strong></td>
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
            const targetPane = document.getElementById(tab.getAttribute('data-tab') + 'Tab');
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

    if (fenceMaterialType) {
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

    if (roofType) {
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

    if (addWallBtn && wallsContainer) {
        let wallCount = 0;

        addWallBtn.addEventListener('click', () => {
            wallCount++;
            const wallDiv = document.createElement('div');
            wallDiv.className = 'wall-item';
            wallDiv.innerHTML = `
                <div class="wall-header">
                    <h4>Стена ${wallCount}</h4>
                    <button class="btn btn-danger btn-sm remove-wall" data-wall="${wallCount}">
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
 * Инициализация обработчиков изменения типа материала
 */
function initMaterialTypeHandlers() {
    // Обработчик для профлиста
    const proflistType = document.getElementById('proflistType');
    const proflistCoating = document.getElementById('proflistCoating');

    if (proflistType && proflistCoating) {
        // Заполняем список типов профлиста
        const proflistMaterials = materialsData.filter(m => m.code.startsWith('C'));
        proflistType.innerHTML = '<option value="">Выберите тип профлиста</option>' +
            proflistMaterials.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        // При выборе типа профлиста обновляем список покрытий
        proflistType.addEventListener('change', () => {
            const materialId = parseInt(proflistType.value);
            const coatings = priceListData
                .filter(p => p.materialId === materialId)
                .map(p => p.coating)
                .filter((c, i, arr) => arr.indexOf(c) === i); // Уникальные значения

            proflistCoating.innerHTML = '<option value="">Выберите покрытие</option>' +
                coatings.map(c => `<option value="${c}">${c}</option>`).join('');
        });
    }
}