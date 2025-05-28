/**
 * admin.js - Скрипт для страницы администрирования
 */

import { api, formatDate, formatCurrency } from './main.js';

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
    await loadCategories();
    await loadMaterials();
    await loadPricelist();
    await loadUsers();
    
    // Инициализация модальных окон
    setupModals();
    
    // Инициализация кнопок
    setupButtons();
});

/**
 * Загрузка категорий
 */
async function loadCategories() {
    try {
        categories = await api.categories.getAll();
        const categoriesList = document.getElementById('categoriesList');
        
        if (!categoriesList) return;
        
        // Очищаем список
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
                ${category.name}
                <div class="category-actions">
                    <button class="btn-icon edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-category" data-id="${category.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            item.setAttribute('data-category-id', category.id);
            item.addEventListener('click', () => selectCategory(category.id));
            
            // Обработчики для кнопок редактирования и удаления
            const editBtn = item.querySelector('.edit-category');
            const deleteBtn = item.querySelector('.delete-category');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editCategory(category.id);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCategory(category.id);
            });
            
            categoriesList.appendChild(item);
        });
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
    }
}

/**
 * Загрузка материалов
 */
async function loadMaterials(categoryId = null) {
    try {
        const params = categoryId ? { categoryId } : {};
        materials = await api.materials.getAll(params);
        
        const materialsTableBody = document.getElementById('materialsTableBody');
        if (!materialsTableBody) return;
        
        // Очищаем таблицу
        materialsTableBody.innerHTML = '';
        
        // Если нет материалов
        if (materials.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="text-center">Нет материалов</td>
            `;
            materialsTableBody.appendChild(emptyRow);
            return;
        }
        
        // Добавляем материалы в таблицу
        materials.forEach(material => {
            const category = categories.find(c => c.id === material.categoryId);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.name}</td>
                <td>${material.code}</td>
                <td>${material.unit}</td>
                <td>${category ? category.name : 'Не указано'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary edit-material" data-id="${material.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-material" data-id="${material.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // Обработчики для кнопок редактирования и удаления
            const editBtn = row.querySelector('.edit-material');
            const deleteBtn = row.querySelector('.delete-material');
            
            editBtn.addEventListener('click', () => editMaterial(material.id));
            deleteBtn.addEventListener('click', () => deleteMaterial(material.id));
            
            materialsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при загрузке материалов:', error);
    }
}

/**
 * Загрузка прайс-листа
 */
async function loadPricelist() {
    try {
        pricelist = await api.prices.getAll();
        const pricelistTableBody = document.getElementById('pricelistTableBody');
        
        if (!pricelistTableBody) return;
        
        // Очищаем таблицу
        pricelistTableBody.innerHTML = '';
        
        // Если нет позиций
        if (pricelist.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" class="text-center">Прайс-лист пуст</td>
            `;
            pricelistTableBody.appendChild(emptyRow);
            return;
        }
        
        // Добавляем позиции в таблицу
        pricelist.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.categoryName}</td>
                <td>${item.materialName}</td>
                <td>${item.coating}</td>
                <td>${item.thickness}</td>
                <td>${formatCurrency(item.price)} ₽</td>
                <td>${formatDate(item.date)}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary edit-price" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-price" data-id="${item.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // Обработчики для кнопок редактирования и удаления
            const editBtn = row.querySelector('.edit-price');
            const deleteBtn = row.querySelector('.delete-price');
            
            editBtn.addEventListener('click', () => editPrice(item.id));
            deleteBtn.addEventListener('click', () => deletePrice(item.id));
            
            pricelistTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при загрузке прайс-листа:', error);
    }
}

/**
 * Загрузка пользователей
 */
async function loadUsers() {
    try {
        users = await api.auth.getUsers();
        const usersTableBody = document.getElementById('usersTableBody');
        
        if (!usersTableBody) return;
        
        // Очищаем таблицу
        usersTableBody.innerHTML = '';
        
        // Если нет пользователей
        if (users.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="text-center">Нет пользователей</td>
            `;
            usersTableBody.appendChild(emptyRow);
            return;
        }
        
        // Добавляем пользователей в таблицу
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.login}</td>
                <td>${user.name}</td>
                <td>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
                <td>${user.lastLogin ? formatDate(user.lastLogin) : 'Нет данных'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary edit-user" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // Обработчики для кнопок редактирования и удаления
            const editBtn = row.querySelector('.edit-user');
            const deleteBtn = row.querySelector('.delete-user');
            
            editBtn.addEventListener('click', () => editUser(user.id));
            deleteBtn.addEventListener('click', () => deleteUser(user.id));
            
            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
    }
}

// ... (остальные функции остаются без изменений, просто меняем прямые манипуляции с данными на вызовы API)