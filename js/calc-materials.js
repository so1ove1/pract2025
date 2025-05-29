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

// [Previous functions remain unchanged until updateResultsTable]

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
        const pricePerM2 = Number(item.price).toFixed(2);
        const pricePerPiece = Number(item.price * item.length * item.overallWidth).toFixed(2);
        const total = Number(item.price * item.length * item.overallWidth * item.quantity).toFixed(2);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>
                <input type="number" class="length-input" value="${item.length}" 
                    min="0.1" step="0.1" data-index="${index}">
            </td>
            <td>${item.quantity}</td>
            <td>
                <input type="number" class="price-input" value="${pricePerM2}" 
                    min="0.01" step="0.01" data-index="${index}">
            </td>
            <td>${formatCurrency(pricePerPiece)}</td>
            <td>${formatCurrency(total)}</td>
        `;
        tbody.appendChild(row);
        totalAmount += Number(total);
    });

    // Add event listeners for inputs
    const lengthInputs = tbody.querySelectorAll('.length-input');
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
            updateResultsTable();
        });
    });

    priceInputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const price = parseFloat(input.value);
            
            if (price <= 0 || isNaN(price)) {
                input.value = calculationResults[index].price;
                return;
            }
            
            calculationResults[index].price = price;
            updateResultsTable();
        });
    });

    totalElement.textContent = `${formatCurrency(totalAmount)} ₽`;
}

// [Previous functions remain unchanged]

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
                        <th>Цена за ед., ₽</th>
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