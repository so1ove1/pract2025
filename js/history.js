/**
 * history.js - Скрипт для страницы истории расчетов
 */

import { api, formatDate, formatCurrency } from './main.js';

let historyData = []; // Массив для хранения истории расчетов
let filteredData = []; // Массив для хранения отфильтрованных данных
const itemsPerPage = 10; // Количество записей на странице
let currentPage = 1; // Текущая страница

document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка данных
    await loadHistoryData();
    
    // Инициализация кнопок фильтров
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Инициализация модального окна просмотра расчета
    const closeCalculationModalBtn = document.getElementById('closeCalculationModalBtn');
    const closeViewBtn = document.getElementById('closeViewBtn');
    const printCalculationBtn = document.getElementById('printCalculationBtn');
    const copyCalculationBtn = document.getElementById('copyCalculationBtn');
    
    if (closeCalculationModalBtn) {
        closeCalculationModalBtn.addEventListener('click', closeCalculationModal);
    }
    
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', closeCalculationModal);
    }
    
    if (printCalculationBtn) {
        printCalculationBtn.addEventListener('click', printCalculationDetails);
    }
    
    if (copyCalculationBtn) {
        copyCalculationBtn.addEventListener('click', copyCalculation);
    }
});

/**
 * Загрузка данных истории расчетов
 */
async function loadHistoryData() {
    try {
        // Получаем данные через API
        historyData = await api.calculations.getAll();
        
        // Применяем начальные фильтры (без фильтров)
        filteredData = [...historyData];
        
        // Отображаем данные
        displayHistoryData();
    } catch (error) {
        console.error('Ошибка при загрузке истории расчетов:', error);
    }
}

/**
 * Применение фильтров
 */
async function applyFilters() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const calculationType = document.getElementById('calculationType').value;
    const amountFrom = document.getElementById('amountFrom').value;
    const amountTo = document.getElementById('amountTo').value;
    
    try {
        // Формируем параметры запроса
        const params = {};
        
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (calculationType) params.type = calculationType;
        if (amountFrom) params.amountFrom = amountFrom;
        if (amountTo) params.amountTo = amountTo;
        
        // Получаем отфильтрованные данные через API
        filteredData = await api.calculations.getAll(params);
        
        // Сбрасываем на первую страницу
        currentPage = 1;
        
        // Отображаем отфильтрованные данные
        displayHistoryData();
    } catch (error) {
        console.error('Ошибка при применении фильтров:', error);
        alert(error.message || 'Ошибка при применении фильтров');
    }
}

/**
 * Удаление расчета
 */
async function deleteCalculation(calculationId) {
    try {
        if (confirm('Вы уверены, что хотите удалить этот расчет?')) {
            await api.calculations.delete(calculationId);
            
            // Обновляем списки
            historyData = historyData.filter(item => item.id !== calculationId);
            filteredData = filteredData.filter(item => item.id !== calculationId);
            
            // Обновляем отображение
            displayHistoryData();
        }
    } catch (error) {
        console.error('Ошибка при удалении расчета:', error);
        alert(error.message || 'Ошибка при удалении расчета');
    }
}

// ... (остальные функции остаются без изменений, они не взаимодействуют с API)