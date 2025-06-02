/**
 * history.js - Скрипт для страницы истории расчетов
 */

import { api, formatDate, formatCurrency } from './main.js';

let historyData = []; // Массив для хранения истории расчетов
let filteredData = []; // Массив для хранения отфильтрованных данных
const itemsPerPage = 10; // Количество записей на странице
let currentPage = 1; // Текущая страница

// Маппинг типов расчетов на отображаемые названия
const typeDisplayNames = {
    'calculation-cost': 'Расчет стоимости',
    'calculation-fence': 'Расчет забора',
    'calculation-roof': 'Расчет крыши',
    'calculation-siding': 'Расчет обшивки',
    'materials-fence': 'Расчет забора',
    'materials-roof': 'Расчет крыши',
    'materials-siding': 'Расчет обшивки'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка данных
    await loadHistoryData();
    
    // Инициализация кнопок фильтров
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const searchInput = document.getElementById('searchName');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Добавляем обработчик для поиска по названию
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
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
        alert(error.message || 'Ошибка при загрузке истории расчетов');
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
    const searchName = document.getElementById('searchName').value.toLowerCase();

    // Валидация фильтров
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
        alert('Дата "с" не может быть позже даты "по"');
        return;
    }

    if (amountFrom && amountTo && parseFloat(amountFrom) > parseFloat(amountTo)) {
        alert('Сумма "от" не может быть больше суммы "до"');
        return;
    }

    // Применяем фильтры
    filteredData = historyData.filter(item => {
        // Фильтр по названию
        if (searchName && !item.name.toLowerCase().includes(searchName)) {
            return false;
        }

        // Фильтр по датам
        if (dateFrom) {
            const itemDate = new Date(item.created_at);
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (itemDate < fromDate) return false;
        }
        
        if (dateTo) {
            const itemDate = new Date(item.created_at);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (itemDate > toDate) return false;
        }

        // Фильтр по типу расчета
        if (calculationType && item.type !== calculationType) {
            return false;
        }

        // Фильтр по сумме
        if (amountFrom && item.amount < parseFloat(amountFrom)) {
            return false;
        }
        if (amountTo && item.amount > parseFloat(amountTo)) {
            return false;
        }

        return true;
    });

    // Сбрасываем на первую страницу
    currentPage = 1;
    
    // Отображаем отфильтрованные данные
    displayHistoryData();
}

/**
 * Сброс фильтров
 */
function resetFilters() {
    document.getElementById('searchName').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('calculationType').value = '';
    document.getElementById('amountFrom').value = '';
    document.getElementById('amountTo').value = '';
    
    filteredData = [...historyData];
    currentPage = 1;
    displayHistoryData();
}

/**
 * Отображение данных истории расчетов
 */
function displayHistoryData() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Нет расчетов</td>
            </tr>
        `;
        updatePagination();
        return;
    }

    // Рассчитываем индексы для текущей страницы
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.created_at)}</td>
            <td>${item.name}</td>
            <td>${typeDisplayNames[item.type] || 'Неизвестный тип'}</td>
            <td>${formatCurrency(item.amount)} ₽</td>
            <td>
                <button class="btn btn-primary btn-sm view-calculation" data-id="${item.id}" title="Просмотр">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-success btn-sm recalculate-btn" data-id="${item.id}" title="Пересчитать">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="btn btn-danger btn-sm delete-calculation" data-id="${item.id}" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Добавляем обработчики для кнопок
    const viewButtons = tbody.querySelectorAll('.view-calculation');
    const deleteButtons = tbody.querySelectorAll('.delete-calculation');
    const recalculateButtons = tbody.querySelectorAll('.recalculate-btn');

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const calculationId = parseInt(button.getAttribute('data-id'));
            viewCalculation(calculationId);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const calculationId = parseInt(button.getAttribute('data-id'));
            deleteCalculation(calculationId);
        });
    });

    recalculateButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const calculationId = parseInt(button.getAttribute('data-id'));
            await recalculatePrice(calculationId);
        });
    });

    updatePagination();
}

/**
 * Пересчет стоимости с актуальными ценами
 */
async function recalculatePrice(calculationId) {
    try {
        const calculation = historyData.find(item => item.id === calculationId);
        if (!calculation) return;

        // Получаем актуальный прайс-лист
        const priceList = await api.prices.getAll();
        let totalAmount = 0;
        let updated = false;

        // Пересчитываем каждую позицию
        const updatedItems = calculation.details.items.map(item => {
            const currentPrice = priceList.find(p => p.id === item.priceId);
            if (currentPrice && currentPrice.price !== item.price) {
                updated = true;
                const newTotal = currentPrice.price * item.quantity * (item.length || 1);
                totalAmount += newTotal;
                return {
                    ...item,
                    price: currentPrice.price,
                    total: newTotal
                };
            } else {
                totalAmount += item.total;
                return item;
            }
        });

        if (!updated) {
            alert('Цены актуальны, пересчет не требуется');
            return;
        }

        // Обновляем расчет
        const updatedCalculation = {
            ...calculation,
            amount: totalAmount,
            details: {
                ...calculation.details,
                items: updatedItems
            }
        };

        // Сохраняем обновленный расчет
        await api.calculations.update(calculationId, updatedCalculation);

        // Обновляем данные в интерфейсе
        const index = historyData.findIndex(item => item.id === calculationId);
        if (index !== -1) {
            historyData[index] = updatedCalculation;
            filteredData = filteredData.map(item => 
                item.id === calculationId ? updatedCalculation : item
            );
        }

        displayHistoryData();
        alert('Расчет успешно обновлен с актуальными ценами');
    } catch (error) {
        console.error('Ошибка при пересчете:', error);
        alert(error.message || 'Ошибка при пересчете стоимости');
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

/**
 * Просмотр расчета
 */
function viewCalculation(calculationId) {
    const calculation = filteredData.find(item => item.id === calculationId);
    if (!calculation) return;

    const modal = document.getElementById('viewCalculationModal');
    const modalBody = document.getElementById('calculationModalBody');
    if (!modal || !modalBody) return;

    // Формируем содержимое модального окна
    let detailsHtml = `
        <div class="calculation-info">
            <p><strong>Название:</strong> ${calculation.name}</p>
            <p><strong>Тип:</strong> ${typeDisplayNames[calculation.type] || 'Неизвестный тип'}</p>
            <p><strong>Дата:</strong> ${formatDate(calculation.created_at)}</p>
        </div>
    `;

    if (calculation.details && calculation.details.items) {
        detailsHtml += `
            <div class="calculation-details">
                <h3>Детали расчета</h3>
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
                        ${calculation.details.items.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.name}</td>
                                <td>${item.unit || 'м²'}</td>
                                <td>${item.length || '-'}</td>
                                <td>${item.quantity || '-'}</td>
                                <td>${item.pricePerM2 ? formatCurrency(item.pricePerM2) : formatCurrency(item.price)}</td>
                                <td>${item.pricePerPiece ? formatCurrency(item.pricePerPiece) : formatCurrency(item.price)}</td>
                                <td>${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="calculation-total">
                    Итого: ${formatCurrency(calculation.amount)} ₽
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = detailsHtml;
    modal.style.display = 'block';
}

/**
 * Закрытие модального окна
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
    const modalBody = document.getElementById('calculationModalBody');
    if (!modalBody) return;

    const printContent = `
        <html>
        <head>
            <title>Детали расчета</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px;
                    color: #1E293B;
                }
                .calculation-info {
                    margin-bottom: 24px;
                    padding: 16px;
                    background-color: #F8FAFC;
                    border-radius: 8px;
                }
                h3 { 
                    color: #2B5DA2;
                    margin-bottom: 16px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0;
                    background-color: white;
                    border-radius: 8px;
                    overflow: hidden;
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #E2E8F0;
                }
                th { 
                    background-color: #F8FAFC;
                    font-weight: 500;
                    color: #334155;
                }
                .calculation-total {
                    margin-top: 20px;
                    text-align: right;
                    font-size: 1.2rem;
                    font-weight: 500;
                    color: #2B5DA2;
                }
            </style>
        </head>
        <body>
            ${modalBody.innerHTML}
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
 * Копирование расчета
 */
function copyCalculation() {
    const modalBody = document.getElementById('calculationModalBody');
    if (!modalBody) return;

    const range = document.createRange();
    range.selectNodeContents(modalBody);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        document.execCommand('copy');
        alert('Расчет скопирован в буфер обмена');
    } catch (error) {
        console.error('Ошибка при копировании:', error);
        alert('Ошибка при копировании');
    }

    selection.removeAllRanges();
}

/**
 * Обновление пагинации
 */
function updatePagination() {
    const pagination = document.getElementById('historyPagination');
    if (!pagination) return;

    const pageCount = Math.ceil(filteredData.length / itemsPerPage);
    pagination.innerHTML = '';

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
        button.addEventListener('click', () => {
            currentPage = i;
            displayHistoryData();
        });
        pagination.appendChild(button);
    }
}