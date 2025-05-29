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
    
    if (!tabs.length || !panes.length) {
        console.warn('Элементы вкладок не найдены');
        return;
    }
    
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
 * Загрузка категорий
 */
async function loadCategories() {
    try {
        categories = await api.categories.getAll();
        const categoriesList = document.getElementById('categoriesList');
        
        if (!categoriesList) {
            console.warn('Элемент списка категорий не найден');
            return;
        }
        
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
                    <button class="btn-icon edit-category" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-category" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            item.setAttribute('data-category-id', category.id);
            item.addEventListener('click', () => selectCategory(category.id));
            
            const editBtn = item.querySelector('.edit-category');
            const deleteBtn = item.querySelector('.delete-category');
            
            if (editBtn && deleteBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editCategory(category.id);
                });
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteCategory(category.id);
                });
            }
            
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
        if (!materialsTableBody) {
            console.warn('Элемент таблицы материалов не найден');
            return;
        }
        
        // Очищаем таблицу
        materialsTableBody.innerHTML = '';
        
        // Если нет материалов
        if (materials.length === 0) {
            materialsTableBody.innerHTML = `
                <tr><td colspan="5" class="text-center">Нет материалов</td></tr>
            `;
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
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const editBtn = row.querySelector('.edit-material');
            const deleteBtn = row.querySelector('.delete-material');
            
            if (editBtn && deleteBtn) {
                editBtn.addEventListener('click', () => editMaterial(material.id));
                deleteBtn.addEventListener('click', () => deleteMaterial(material.id));
            }
            
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
        
        if (!pricelistTableBody) {
            console.warn('Элемент таблицы прайс-листа не найден');
            return;
        }
        
        // Очищаем таблицу
        pricelistTableBody.innerHTML = '';
        
        // Если нет позиций
        if (pricelist.length === 0) {
            pricelistTableBody.innerHTML = `
                <tr><td colspan="7" class="text-center">Прайс-лист пуст</td></tr>
            `;
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
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const editBtn = row.querySelector('.edit-price');
            const deleteBtn = row.querySelector('.delete-price');
            
            if (editBtn && deleteBtn) {
                editBtn.addEventListener('click', () => editPrice(item.id));
                deleteBtn.addEventListener('click', () => deletePrice(item.id));
            }
            
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
        
        if (!usersTableBody) {
            console.warn('Элемент таблицы пользователей не найден');
            return;
        }
        
        // Очищаем таблицу
        usersTableBody.innerHTML = '';
        
        // Если нет пользователей
        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr><td colspan="5" class="text-center">Нет пользователей</td></tr>
            `;
            return;
        }
        
        // Добавляем пользователей в таблицу
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.login}</td>
                <td>${user.name}</td>
                <td>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
                <td>${user.last_login ? formatDate(user.last_login) : 'Нет данных'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary edit-user" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const editBtn = row.querySelector('.edit-user');
            const deleteBtn = row.querySelector('.delete-user');
            
            if (editBtn && deleteBtn) {
                editBtn.addEventListener('click', () => editUser(user.id));
                deleteBtn.addEventListener('click', () => deleteUser(user.id));
            }
            
            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
    }
}

/**
 * Настройка модальных окон
 */
function setupModals() {
    const addUserModal = document.getElementById('userModal');
    const addUserForm = document.getElementById('userForm');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    
    if (addUserModal && addUserForm && closeUserModalBtn && cancelUserBtn) {
        addUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const login = document.getElementById('userLogin').value;
            const name = document.getElementById('userName').value;
            const password = document.getElementById('userPassword').value;
            const role = document.getElementById('userRole').value;
            
            try {
                if (currentUserId) {
                    alert('Обновление пользователя не поддерживается в текущей версии');
                } else {
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
            const addUserModal = document.getElementById('userModal');
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