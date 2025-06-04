/**
 * admin.js - Скрипт для страницы администрирования
 */

import { api, formatDate, formatCurrency } from './main.js';

// Глобальные переменные
let categories = []; // Для хранения категорий
let materials = []; // Для хранения материалов
let pricelist = []; // Для хранения прайс-листа
let users = []; // Для хранения пользователей

// Текущие идентификаторы для редактирования
let currentCategoryId = null;
let currentMaterialId = null;
let currentPriceId = null;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Проверка прав доступа
    checkAdminAccess();
    
    // Инициализация вкладок
    setupAdminTabs();
    
    // Загрузка данных
    await Promise.all([
        loadCategories(),
        loadMaterials(),
        loadPricelist(),
        loadUsers()
    ]).catch(error => {
        console.error('Ошибка при загрузке данных:', error);
    });
    
    // Инициализация модальных окон
    setupModals();
    
    // Инициализация кнопок
    setupButtons();

    // Инициализация фильтров прайс-листа
    setupPricelistFilters();
});

/**
 * Проверка прав администратора
 */
function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

/**
 * Настройка вкладок
 */
function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tabs .tab-btn');
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
 * Настройка модальных окон
 */
function setupModals() {
    // Модальное окно для категорий
    const categoryModal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');
    const closeCategoryModalBtn = document.getElementById('closeCategoryModalBtn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    const addCategoryBtn = document.getElementById('addMaterialCategoryBtn');

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            currentCategoryId = null;
            const categoryModalTitle = document.getElementById('categoryModalTitle');
            if (categoryModalTitle) {
                categoryModalTitle.textContent = 'Добавление категории';
            }
            document.getElementById('categoryName').value = '';
            categoryModal.style.display = 'block';
        });
    }

    if (categoryModal && categoryForm && closeCategoryModalBtn && cancelCategoryBtn && saveCategoryBtn) {
        // Обработчик сохранения категории
        saveCategoryBtn.addEventListener('click', async () => {
            const name = document.getElementById('categoryName').value.trim();
            
            if (!name) {
                alert('Введите название категории');
                return;
            }

            try {
                if (currentCategoryId) {
                    await api.categories.update(currentCategoryId, { name });
                } else {
                    await api.categories.create({ name });
                }
                
                categoryModal.style.display = 'none';
                categoryForm.reset();
                currentCategoryId = null;
                await loadCategories();
                alert(currentCategoryId ? 'Категория обновлена' : 'Категория создана');
            } catch (error) {
                console.error('Ошибка при сохранении категории:', error);
                alert(error.message || 'Ошибка при сохранении категории');
            }
        });

        // Обработчики закрытия
        [closeCategoryModalBtn, cancelCategoryBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                categoryModal.style.display = 'none';
                categoryForm.reset();
                currentCategoryId = null;
            });
        });
    }

    // Остальные модальные окна остаются без изменений
    // ... (код для других модальных окон)
}

/**
 * Загрузка категорий
 */
async function loadCategories() {
    try {
        categories = await api.categories.getAll();
        const categoriesList = document.getElementById('categoriesList');
        
        if (!categoriesList) return;
        
        categoriesList.innerHTML = '';
        
        // Добавляем элемент "Все категории"
        const allItem = document.createElement('li');
        allItem.textContent = 'Все категории';
        allItem.setAttribute('data-category-id', '');
        allItem.classList.add('active');
        allItem.addEventListener('click', () => selectCategory(''));
        categoriesList.appendChild(allItem);
        
        // Добавляем категории
        categories.forEach(category => {
            const item = document.createElement('li');
            item.innerHTML = `
                <span class="category-name">${category.name}</span>
                <div class="category-actions">
                    <button class="btn-icon edit-category" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-category" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            item.setAttribute('data-category-id', category.id);
            
            const categoryName = item.querySelector('.category-name');
            if (categoryName) {
                categoryName.addEventListener('click', () => selectCategory(category.id));
            }
            
            const editBtn = item.querySelector('.edit-category');
            const deleteBtn = item.querySelector('.delete-category');
            
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editCategory(category);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteCategory(category.id);
                });
            }
            
            categoriesList.appendChild(item);
        });

        // Обновляем селект категорий в форме материалов
        const materialCategorySelect = document.getElementById('materialCategory');
        if (materialCategorySelect) {
            materialCategorySelect.innerHTML = categories.map(category =>
                `<option value="${category.id}">${category.name}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
    }
}

/**
 * Редактирование категории
 */
function editCategory(category) {
    currentCategoryId = category.id;
    const categoryModal = document.getElementById('categoryModal');
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    
    if (categoryModal && categoryModalTitle) {
        categoryModalTitle.textContent = 'Редактирование категории';
        document.getElementById('categoryName').value = category.name;
        categoryModal.style.display = 'block';
    }
}

/**
 * Удаление категории
 */
async function deleteCategory(id) {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
        try {
            await api.categories.delete(id);
            await loadCategories();
            await loadMaterials();
            alert('Категория удалена');
        } catch (error) {
            console.error('Ошибка при удалении категории:', error);
            alert(error.message || 'Ошибка при удалении категории');
        }
    }
}

// Остальные функции остаются без изменений
// ... (остальной код файла)