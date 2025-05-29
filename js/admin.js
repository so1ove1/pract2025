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
            document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
        });
    });
}

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
        alert('Не удалось загрузить категории');
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
                	Нет материалов
            `;
            materialsTableBody.appendChild(emptyRow);
            return;
        }
        
        // Добавляем материалы в таблицу
        materials.forEach(material => {
            const category = categories.find(c => c.id === material.categoryId);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                	${material.name}	${material.code}	${material.unit}	${category ? category.name : 'Не указано'}	
                    
                        
                    
                    <button class="btn btn-sm btn-danger delete-material" data-id="${material.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                
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
        alert('Не удалось загрузить материалы');
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
                	Прайс-лист пуст
            `;
            pricelistTableBody.appendChild(emptyRow);
            return;
        }
        
        // Добавляем позиции в таблицу
        pricelist.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                	${item.categoryName}	${item.materialName}	${item.coating}	${item.thickness}	${formatCurrency(item.price)} ₽	${formatDate(item.date)}	
                    
                        
                    
                    <button class="btn btn-sm btn-danger delete-price" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                
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
        alert('Не удалось загрузить прайс-лист');
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
                	Нет пользователей
            `;
            usersTableBody.appendChild(emptyRow);
            return;
        }
        
        // Добавляем пользователей в таблицу
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                	${user.login}	${user.name}	${user.role === 'admin' ? 'Администратор' : 'Пользователь'}	${user.lastLogin ? formatDate(user.lastLogin) : 'Нет данных'}	
                    
                        
                    
                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                
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
        alert('Не удалось загрузить пользователей');
    }
}

/**
 * Настройка модальных окон
 */
function setupModals() {
    const addUserModal = document.getElementById('addUserModal');
    const addUserForm = document.getElementById('addUserForm');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    
    if (addUserModal && addUserForm) {
        addUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const login = document.getElementById('userLogin').value;
            const name = document.getElementById('userName').value;
            const password = document.getElementById('userPassword').value;
            const role = document.getElementById('userRole').value;
            
            try {
                if (currentUserId) {
                    // Обновление пользователя (не реализовано в текущем API)
                    alert('Обновление пользователя не поддерживается в текущей версии');
                } else {
                    // Создание нового пользователя
                    await api.auth.createUser({ login, name, password, role });
                    alert('Пользователь успешно создан');
                    await loadUsers();
                    addUserModal.style.display = 'none';
                    addUserForm.reset();
                }
            } catch (error) {
                console.error('Ошибка при сохранении пользователя:', error);
                alert(error.message || 'Ошибка при сохранении пользователя');
            }
        });
        
        closeUserModalBtn.addEventListener('click', () => {
            addUserModal.style.display = 'none';
            addUserForm.reset();
            currentUserId = null;
        });
        
        cancelUserBtn.addEventListener('click', () => {
            addUserModal.style.display = 'none';
            addUserForm.reset();
            currentUserId = null;
        });
    }
}

/**
 * Настройка кнопок
 */
function setupButtons() {
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            const addUserModal = document.getElementById('addUserModal');
            if (addUserModal) {
                addUserModal.style.display = 'block';
            }
        });
    }
}

/**
 * Выбор категории
 */
function selectCategory(categoryId) {
    const items = document.querySelectorAll('#categoriesList li');
    items.forEach(item => item.classList.remove('active'));
    
    const selectedItem = document.querySelector(`#categoriesList li[data-category-id="${categoryId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    loadMaterials(categoryId);
}

/**
 * Редактирование категории
 */
function editCategory(id) {
    // Реализация редактирования категории
    alert('Редактирование категории не реализовано');
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

/**
 * Редактирование материала
 */
function editMaterial(id) {
    // Реализация редактирования материала
    alert('Редактирование материала не реализовано');
}

/**
 * Удаление материала
 */
async function deleteMaterial(id) {
    if (confirm('Вы уверены, что хотите удалить этот материал?')) {
        try {
            await api.materials.delete(id);
            await loadMaterials();
            alert('Материал удален');
        } catch (error) {
            console.error('Ошибка при удалении материала:', error);
            alert(error.message || 'Ошибка при удалении материала');
        }
    }
}

/**
 * Редактирование цены
 */
function editPrice(id) {
    // Реализация редактирования цены
    alert('Редактирование цены не реализовано');
}

/**
 * Удаление цены
 */
async function deletePrice(id) {
    if (confirm('Вы уверены, что хотите удалить эту позицию прайс-листа?')) {
        try {
            await api.prices.delete(id);
            await loadPricelist();
            alert('Позиция прайс-листа удалена');
        } catch (error) {
            console.error('Ошибка при удалении позиции:', error);
            alert(error.message || 'Ошибка при удалении позиции');
        }
    }
}

/**
 * Редактирование пользователя
 */
function editUser(id) {
    // Реализация редактирования пользователя
    alert('Редактирование пользователя не реализовано');
}

/**
 * Удаление пользователя
 */
async function deleteUser(id) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        try {
            await api.auth.deleteUser(id);
            await loadUsers();
            alert('Пользователь удален');
        } catch (error) {
            console.error('Ошибка при удалении пользователя:', error);
            alert(error.message || 'Ошибка при удалении пользователя');
        }
    }
}