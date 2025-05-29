/**
 * calc-materials.js - Скрипт для страницы расчета материалов
 */

import { api, formatCurrency } from './main.js';

// Глобальные переменные
let materialsData = []; // Материалы
let priceListData = []; // Прайс-лист
let calculationResults = []; // Результаты расчета

// Функция округления для расчетов
function customRound(value) {
    return Math.ceil(value);
}

// Обновление таблицы результатов
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
        const pricePerPiece = item.price * item.overallWidth * item.length;
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
                    min="1" step="1" data-index="${index}" readonly>
            </td>
            <td>
                <input type="number" class="price-input" value="${item.price.toFixed(2)}" 
                    min="0.01" step="0.01" data-index="${index}">
            </td>
            <td>${formatCurrency(pricePerPiece)} ₽</td>
            <td>${formatCurrency(item.total)} ₽</td>
        `;
        
        tbody.appendChild(row);
        totalAmount += item.total;
    });
    
    // Добавляем обработчики для изменения значений
    const inputs = tbody.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'));
            const item = calculationResults[index];
            
            if (input.classList.contains('length-input')) {
                const length = parseFloat(input.value);
                if (length > 0) {
                    item.length = length;
                    // Пересчитываем количество и общую стоимость
                    item.quantity = calculateQuantity(item);
                    item.total = calculateTotal(item);
                    updateResultsTable();
                } else {
                    input.value = item.length;
                }
            } else if (input.classList.contains('price-input')) {
                const price = parseFloat(input.value);
                if (price > 0) {
                    item.price = price;
                    // Пересчитываем общую стоимость
                    item.total = calculateTotal(item);
                    updateResultsTable();
                } else {
                    input.value = item.price.toFixed(2);
                }
            }
        });
    });
    
    totalElement.textContent = `${formatCurrency(totalAmount)} ₽`;
}

// Расчет количества материала
function calculateQuantity(item) {
    switch (item.type) {
        case 'fence-proflist':
        case 'fence-stake':
            return customRound(item.fenceLength / item.workingWidth);
        case 'roof':
            return customRound(item.roofWidth / item.workingWidth);
        case 'siding':
            return customRound(item.wallWidth / item.workingWidth);
        default:
            return 1;
    }
}

// Расчет общей стоимости
function calculateTotal(item) {
    return item.price * item.overallWidth * item.length * item.quantity;
}

// Загрузка материалов
async function loadMaterials() {
    try {
        materialsData = await api.getMaterials();
        priceListData = await api.getPriceList();
        updateMaterialsSelect();
    } catch (error) {
        console.error('Ошибка загрузки материалов:', error);
    }
}

// Обновление выпадающего списка материалов
function updateMaterialsSelect() {
    const select = document.getElementById('materialSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите материал</option>';
    materialsData.forEach(material => {
        const option = document.createElement('option');
        option.value = material.id;
        option.textContent = material.name;
        select.appendChild(option);
    });
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    loadMaterials();
    
    // Обработчик формы расчета
    const form = document.getElementById('calculationForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const materialId = document.getElementById('materialSelect').value;
            const material = materialsData.find(m => m.id === materialId);
            if (!material) return;
            
            const priceData = priceListData.find(p => p.materialId === materialId);
            if (!priceData) return;
            
            const result = {
                name: material.name,
                type: material.type,
                unit: material.unit,
                workingWidth: material.workingWidth,
                overallWidth: material.overallWidth,
                length: parseFloat(document.getElementById('length').value) || 0,
                price: priceData.price,
                quantity: 0,
                total: 0
            };
            
            // Добавляем специфичные параметры в зависимости от типа материала
            switch (material.type) {
                case 'fence-proflist':
                case 'fence-stake':
                    result.fenceLength = parseFloat(document.getElementById('fenceLength').value) || 0;
                    break;
                case 'roof':
                    result.roofWidth = parseFloat(document.getElementById('roofWidth').value) || 0;
                    break;
                case 'siding':
                    result.wallWidth = parseFloat(document.getElementById('wallWidth').value) || 0;
                    break;
            }
            
            result.quantity = calculateQuantity(result);
            result.total = calculateTotal(result);
            
            calculationResults.push(result);
            updateResultsTable();
            form.reset();
        });
    }
});