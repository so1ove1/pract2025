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
        // Фиксированное количество знаков после запятой для цены за м²
        const pricePerM2 = Number(item.price).toFixed(2);
        
        // Расчет цены за штуку (лист)
        const pricePerPiece = item.price * item.length * item.overallWidth;
        
        // Расчет общей суммы
        const total = pricePerPiece * item.quantity;

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
        totalAmount += total;
    });

    // Добавляем обработчики для изменения длины и цены
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

// [Rest of the file remains unchanged]