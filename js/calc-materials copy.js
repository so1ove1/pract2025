/**
 * calc-materials.js - Скрипт для страницы расчета материалов
 */

import { api, formatCurrency } from './main.js';

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
 * Загрузка данных о материалах и ценах
 */
async function loadMaterialsData() {
    try {
        materialsData = await api.materials.getAll();
        priceListData = await api.prices.getAll();

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

// ... (остальные функции остаются без изменений, просто меняем fetchData на api.materials.getAll и api.prices.getAll)

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

        // Сохраняем расчет через API
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