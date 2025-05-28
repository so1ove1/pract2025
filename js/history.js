/**
 * history.js - Скрипт для страницы истории расчетов
 */

import { fetchData, formatDate, formatCurrency } from './main.js';

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
        // Получаем текущего пользователя
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            return;
        }
        
        // В реальном приложении здесь был бы запрос на сервер
        // Для демонстрации используем данные из localStorage
        let savedCalculations = localStorage.getItem('savedCalculations');
        
        if (savedCalculations) {
            savedCalculations = JSON.parse(savedCalculations);
            historyData = savedCalculations.filter(item => item.userId === currentUser.id);
        }
        
        // Применяем начальные фильтры (без фильтров)
        filteredData = [...historyData];
        
        // Отображаем данные
        displayHistoryData();
    } catch (error) {
        console.error('Ошибка при загрузке истории расчетов:', error);
    }
}

/**
 * Отображение данных истории расчетов
 */
function displayHistoryData() {
    const historyTableBody = document.getElementById('historyTableBody');
    const paginationContainer = document.getElementById('historyPagination');
    
    if (!historyTableBody) return;
    
    // Очищаем таблицу
    historyTableBody.innerHTML = '';
    
    // Если нет данных
    if (filteredData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="text-center">Нет данных для отображения</td>
        `;
        historyTableBody.appendChild(emptyRow);
        
        // Очищаем пагинацию
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        
        return;
    }
    
    // Пагинация
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (currentPage > totalPages) {
        currentPage = 1;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    // Отображаем данные для текущей страницы
    for (let i = startIndex; i < endIndex; i++) {
        const item = filteredData[i];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td>${item.name}</td>
            <td>${getCalculationTypeName(item.type)}</td>
            <td>${formatCurrency(item.amount)} ₽</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-primary view-calculation" data-id="${item.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-calculation" data-id="${item.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Обработчики для кнопок просмотра и удаления
        const viewBtn = row.querySelector('.view-calculation');
        const deleteBtn = row.querySelector('.delete-calculation');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', () => viewCalculation(item.id));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteCalculation(item.id));
        }
        
        historyTableBody.appendChild(row);
    }
    
    // Обновляем пагинацию
    if (paginationContainer) {
        updatePagination(totalPages);
    }
}

/**
 * Обновление пагинации
 * @param {number} totalPages - Общее количество страниц
 */
function updatePagination(totalPages) {
    const paginationContainer = document.getElementById('historyPagination');
    
    if (!paginationContainer) return;
    
    // Очищаем пагинацию
    paginationContainer.innerHTML = '';
    
    // Если страниц меньше 2, не отображаем пагинацию
    if (totalPages < 2) {
        return;
    }
    
    // Кнопка "Предыдущая"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayHistoryData();
        }
    });
    
    paginationContainer.appendChild(prevBtn);
    
    // Кнопки с номерами страниц
    const maxVisiblePages = 5; // Максимальное количество видимых страниц
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayHistoryData();
        });
        
        paginationContainer.appendChild(pageBtn);
    }
    
    // Кнопка "Следующая"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayHistoryData();
        }
    });
    
    paginationContainer.appendChild(nextBtn);
}

/**
 * Получение названия типа расчета
 * @param {string} type - Тип расчета
 * @returns {string} - Название типа расчета
 */
function getCalculationTypeName(type) {
    switch (type) {
        case 'cost': return 'Расчет стоимости';
        case 'materials-fence': return 'Расчет забора';
        case 'materials-roof': return 'Расчет крыши';
        case 'materials-siding': return 'Расчет обшивки';
        default: return 'Неизвестный тип';
    }
}

/**
 * Применение фильтров
 */
function applyFilters() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const calculationType = document.getElementById('calculationType').value;
    const amountFrom = document.getElementById('amountFrom').value;
    const amountTo = document.getElementById('amountTo').value;
    
    // Создаем копию исходных данных
    filteredData = [...historyData];
    
    // Применяем фильтры
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredData = filteredData.filter(item => new Date(item.date) >= fromDate);
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        filteredData = filteredData.filter(item => new Date(item.date) <= toDate);
    }
    
    if (calculationType) {
        filteredData = filteredData.filter(item => item.type === calculationType);
    }
    
    if (amountFrom) {
        filteredData = filteredData.filter(item => item.amount >= parseFloat(amountFrom));
    }
    
    if (amountTo) {
        filteredData = filteredData.filter(item => item.amount <= parseFloat(amountTo));
    }
    
    // Сбрасываем на первую страницу
    currentPage = 1;
    
    // Отображаем отфильтрованные данные
    displayHistoryData();
}

/**
 * Сброс фильтров
 */
function resetFilters() {
    // Очищаем поля фильтров
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const calculationType = document.getElementById('calculationType');
    const amountFrom = document.getElementById('amountFrom');
    const amountTo = document.getElementById('amountTo');
    
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (calculationType) calculationType.value = '';
    if (amountFrom) amountFrom.value = '';
    if (amountTo) amountTo.value = '';
    
    // Сбрасываем фильтрацию
    filteredData = [...historyData];
    currentPage = 1;
    
    // Отображаем данные
    displayHistoryData();
}

/**
 * Просмотр деталей расчета
 * @param {number} calculationId - Идентификатор расчета
 */
async function viewCalculation(calculationId) {
    try {
        // Находим расчет в данных
        const calculation = filteredData.find(item => item.id === calculationId);
        
        if (!calculation) {
            alert('Расчет не найден');
            return;
        }
        
        // Получаем данные расчета
        const details = calculation;
        
        // Открываем модальное окно
        const modal = document.getElementById('viewCalculationModal');
        const modalTitle = document.getElementById('calculationModalTitle');
        const modalBody = document.getElementById('calculationModalBody');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        // Устанавливаем заголовок
        modalTitle.textContent = `Расчет: ${details.name}`;
        
        // Формируем содержимое в зависимости от типа расчета
        let content = '';
        
        content += `
            <div class="calculation-header">
                <p><strong>Дата:</strong> ${formatDate(details.date)}</p>
                <p><strong>Тип расчета:</strong> ${getCalculationTypeName(details.type)}</p>
                <p><strong>Сумма:</strong> ${formatCurrency(details.amount)} ₽</p>
            </div>
        `;
        
        // Если это расчет стоимости
        if (details.type === 'cost' && details.details && details.details.items) {
            content += `
                <div class="calculation-details">
                    <h4>Список материалов</h4>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>Название</th>
                                    <th>Кол-во</th>
                                    <th>Цена, ₽</th>
                                    <th>Сумма, ₽</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            details.details.items.forEach((item, index) => {
                content += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)} ₽</td>
                        <td>${formatCurrency(item.total)} ₽</td>
                    </tr>
                `;
            });
            
            content += `
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4" class="text-right"><strong>Итого:</strong></td>
                                    <td>${formatCurrency(details.amount)} ₽</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }
        // Для других типов расчетов можно добавить специфичное отображение
        else if (details.type.startsWith('materials-')) {
            // Общая информация о параметрах расчета
            content += '<div class="calculation-details">';
            
            if (details.type === 'materials-fence') {
                content += '<h4>Параметры забора</h4><ul>';
                
                if (details.details.materialType === 'proflist') {
                    content += `
                        <li><strong>Тип материала:</strong> Профлист</li>
                        <li><strong>Тип профлиста:</strong> ${details.details.proflistType || 'Не указан'}</li>
                        <li><strong>Длина забора:</strong> ${details.details.fenceLength} м</li>
                        <li><strong>Высота забора:</strong> ${details.details.fenceHeight} м</li>
                    `;
                } else {
                    content += `
                        <li><strong>Тип материала:</strong> Штакетник</li>
                        <li><strong>Тип штакетника:</strong> ${details.details.stakeType || 'Не указан'}</li>
                        <li><strong>Длина забора:</strong> ${details.details.fenceLength} м</li>
                        <li><strong>Высота забора:</strong> ${details.details.fenceHeight} м</li>
                        <li><strong>Расстояние между штакетинами:</strong> ${details.details.stakeSpacing || 'Не указано'} мм</li>
                    `;
                }
                
                content += '</ul>';
            } else if (details.type === 'materials-roof') {
                content += '<h4>Параметры крыши</h4><ul>';
                
                content += `
                    <li><strong>Тип материала:</strong> ${details.details.materialType === 'metalTile' ? 'Металлочерепица' : 'Профлист'}</li>
                    <li><strong>Тип крыши:</strong> ${getRoofTypeName(details.details.roofType)}</li>
                    <li><strong>Длина:</strong> ${details.details.length} м</li>
                    <li><strong>Ширина:</strong> ${details.details.width} м</li>
                    <li><strong>Угол наклона:</strong> ${details.details.angle}°</li>
                `;
                
                content += '</ul>';
            } else if (details.type === 'materials-siding') {
                content += '<h4>Параметры обшивки</h4><ul>';
                
                content += `
                    <li><strong>Тип материала:</strong> ${details.details.materialType === 'proflist' ? 'Профлист' : 'Сайдинг'}</li>
                    <li><strong>Количество стен:</strong> ${details.details.walls ? details.details.walls.length : 0}</li>
                `;
                
                if (details.details.walls && details.details.walls.length > 0) {
                    content += '<li><strong>Размеры стен:</strong><ul>';
                    
                    details.details.walls.forEach((wall, index) => {
                        content += `<li>Стена ${index + 1}: ${wall.width} × ${wall.height} м</li>`;
                    });
                    
                    content += '</ul></li>';
                }
                
                content += '</ul>';
            }
            
            content += '</div>';
        }
        
        // Устанавливаем содержимое
        modalBody.innerHTML = content;
        
        // Отображаем модальное окно
        modal.style.display = 'block';
    } catch (error) {
        console.error('Ошибка при загрузке деталей расчета:', error);
        alert('Ошибка при загрузке деталей расчета');
    }
}

/**
 * Закрытие модального окна просмотра расчета
 */
function closeCalculationModal() {
    const modal = document.getElementById('viewCalculationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Печать деталей расчета
 */
function printCalculationDetails() {
    // Получаем содержимое модального окна
    const modalTitle = document.getElementById('calculationModalTitle');
    const modalBody = document.getElementById('calculationModalBody');
    
    if (!modalTitle || !modalBody) return;
    
    // Создаем содержимое для печати
    let printContent = `
        <html>
        <head>
            <title>${modalTitle.textContent}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1, h4 { color: #2B5DA2; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .text-right { text-align: right; }
                .company-info { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="company-info">
                <h1>ООО «Братск Профиль»</h1>
                <h2>${modalTitle.textContent}</h2>
            </div>
            ${modalBody.innerHTML}
        </body>
        </html>
    `;
    
    // Открываем новое окно для печати
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Запускаем печать
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}

/**
 * Копирование расчета
 */
function copyCalculation() {
    alert('Функция копирования расчета находится в разработке');
}

/**
 * Удаление расчета
 * @param {number} calculationId - Идентификатор расчета
 */
function deleteCalculation(calculationId) {
    const calculation = filteredData.find(item => item.id === calculationId);
    
    if (calculation) {
        if (confirm(`Вы уверены, что хотите удалить расчет "${calculation.name}"?`)) {
            // В реальном приложении здесь был бы запрос на сервер
            // Для демонстрации используем localStorage
            
            // Получаем текущие сохраненные расчеты
            let savedCalculations = localStorage.getItem('savedCalculations');
            
            if (savedCalculations) {
                savedCalculations = JSON.parse(savedCalculations);
                
                // Удаляем расчет
                const index = savedCalculations.findIndex(item => item.id === calculationId);
                
                if (index !== -1) {
                    savedCalculations.splice(index, 1);
                    
                    // Сохраняем обновленный список
                    localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
                }
            }
            
            // Удаляем из текущих данных
            const indexInHistory = historyData.findIndex(item => item.id === calculationId);
            
            if (indexInHistory !== -1) {
                historyData.splice(indexInHistory, 1);
            }
            
            const indexInFiltered = filteredData.findIndex(item => item.id === calculationId);
            
            if (indexInFiltered !== -1) {
                filteredData.splice(indexInFiltered, 1);
            }
            
            // Обновляем отображение
            displayHistoryData();
        }
    }
}

/**
 * Получение названия типа крыши
 * @param {string} roofType - Тип крыши
 * @returns {string} - Название типа крыши
 */
function getRoofTypeName(roofType) {
    switch (roofType) {
        case 'single': return 'односкатная';
        case 'double': return 'двускатная';
        case 'hipped': return 'вальмовая';
        case 'tent': return 'шатровая';
        default: return '';
    }
}