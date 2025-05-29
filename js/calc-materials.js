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

        // Добавляем обработчики изменения типа материала
        const materialSelects = ['proflistType', 'stakeType'];
        materialSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.addEventListener('change', () => {
                    const type = selectId.replace('Type', '');
                    updateCoatingOptions(type);
                });
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// ... (остальные функции остаются без изменений)

/**
 * Обновление опций покрытия
 */
function updateCoatingOptions(materialType) {
    const coatingSelect = document.getElementById(`${materialType}Coating`);
    if (!coatingSelect) return;
    
    const materialSelect = document.getElementById(`${materialType}Type`);
    if (!materialSelect) return;
    
    const materialId = materialSelect.value;
    
    // Находим все цены для выбранного материала
    const prices = priceListData.filter(p => p.materialId === materialId);
    
    // Получаем уникальные покрытия
    const uniqueCoatings = [...new Set(prices.map(p => p.coating))];
    
    // Обновляем список покрытий
    coatingSelect.innerHTML = uniqueCoatings.map(coating => 
        `<option value="${coating}">${coating}</option>`
    ).join('');

    // Добавляем обработчик для обновления толщины при изменении покрытия
    coatingSelect.addEventListener('change', () => {
        updateThicknessOptions(materialType, materialId, coatingSelect.value);
    });

    // Обновляем толщины для первого покрытия
    if (uniqueCoatings.length > 0) {
        updateThicknessOptions(materialType, materialId, uniqueCoatings[0]);
    }
}

/**
 * Обновление опций толщины
 */
function updateThicknessOptions(materialType, materialId, coating) {
    const thicknessSelect = document.getElementById(`${materialType}Thickness`);
    if (!thicknessSelect) return;

    // Находим все цены для выбранного материала и покрытия
    const prices = priceListData.filter(p => 
        p.materialId === materialId && 
        p.coating === coating
    );

    // Получаем уникальные значения толщины
    const uniqueThicknesses = [...new Set(prices.map(p => p.thickness))];

    // Обновляем список толщин
    thicknessSelect.innerHTML = uniqueThicknesses.map(thickness => 
        `<option value="${thickness}">${thickness} мм</option>`
    ).join('');
}

// ... (остальные функции остаются без изменений)