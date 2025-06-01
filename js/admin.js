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
        
        materialsTableBody.innerHTML = '';
        
        if (materials.length === 0) {
            materialsTableBody.innerHTML = `
                <tr><td colspan="5" class="text-center">Нет материалов</td></tr>
            `;
            return;
        }
        
        materials.forEach(material => {
            const category = categories.find(c => c.id === material.category_id);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.name}</td>
                <td>${material.code}</td>
                <td>${material.unit}</td>
                <td>${category ? category.name : 'Не указано'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary edit-material" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-material" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const editBtn = row.querySelector('.edit-material');
            const deleteBtn = row.querySelector('.delete-material');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => editMaterial(material));
            }
            
            if (deleteBtn) {
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
        
        if (!pricelistTableBody) return;
        
        pricelistTableBody.innerHTML = '';
        
        if (pricelist.length === 0) {
            pricelistTableBody.innerHTML = `
                <tr><td colspan="7" class="text-center">Прайс-лист пуст</td></tr>
            `;
            return;
        }
        
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
                    <button class="btn btn-sm btn-primary edit-price" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-price" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const editBtn = row.querySelector('.edit-price');
            const deleteBtn = row.querySelector('.delete-price');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => editPrice(item));
            }
            
            if (deleteBtn) {
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
        
        if (!usersTableBody) return;
        
        usersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr><td colspan="5" class="text-center">Нет пользователей</td></tr>
            `;
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.login}</td>
                <td>${user.name}</td>
                <td>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
                <td>${user.last_login ? formatDate(user.last_login) : 'Нет данных'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary edit-user" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-user" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const editBtn = row.querySelector('.edit-user');
            const deleteBtn = row.querySelector('.delete-user');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => editUser(user));
            }
            
            if (deleteBtn) {
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
    // Модальное окно для категорий
    const addCategoryBtn = document.getElementById('addMaterialCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const categoryName = prompt('Введите название категории:');
            if (categoryName) {
                createCategory(categoryName);
            }
        });
    }

    // Модальное окно для материалов
    const materialModal = document.getElementById('materialModal');
    const materialForm = document.getElementById('materialForm');
    const closeMaterialModalBtn = document.getElementById('closeMaterialModalBtn');
    const cancelMaterialBtn = document.getElementById('cancelMaterialBtn');
    const saveMaterialBtn = document.getElementById('saveMaterialBtn');
    
    if (materialModal && materialForm && closeMaterialModalBtn && cancelMaterialBtn && saveMaterialBtn) {
        // Обработчик сохранения материала
        saveMaterialBtn.addEventListener('click', async () => {
            const formData = {
                name: document.getElementById('materialName').value,
                code: document.getElementById('materialCode').value,
                unit: document.getElementById('materialUnit').value,
                category_id: parseInt(document.getElementById('materialCategory').value),
                overall_width: parseFloat(document.getElementById('materialOverallWidth').value),
                working_width: parseFloat(document.getElementById('materialWorkingWidth').value)
            };

            try {
                if (currentMaterialId) {
                    await api.materials.update(currentMaterialId, formData);
                } else {
                    await api.materials.create(formData);
                }
                
                materialModal.style.display = 'none';
                materialForm.reset();
                currentMaterialId = null;
                await loadMaterials();
                alert(currentMaterialId ? 'Материал обновлен' : 'Материал создан');
            } catch (error) {
                console.error('Ошибка при сохранении материала:', error);
                alert(error.message || 'Ошибка при сохранении материала');
            }
        });

        // Обработчики закрытия
        [closeMaterialModalBtn, cancelMaterialBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                materialModal.style.display = 'none';
                materialForm.reset();
                currentMaterialId = null;
            });
        });
    }

    // Модальное окно для пользователей
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    const saveUserBtn = document.getElementById('saveUserBtn');
    
    if (userModal && userForm && closeUserModalBtn && cancelUserBtn && saveUserBtn) {
        // Обработчик сохранения пользователя
        saveUserBtn.addEventListener('click', async () => {
            const formData = {
                login: document.getElementById('userLogin').value,
                name: document.getElementById('userName').value,
                password: document.getElementById('userPassword').value,
                role: document.getElementById('userRole').value
            };

            try {
                if (currentUserId) {
                    // Обновление пользователя не реализовано в API
                    alert('Обновление пользователя не поддерживается в текущей версии');
                } else {
                    await api.auth.createUser(formData);
                    userModal.style.display = 'none';
                    userForm.reset();
                    await loadUsers();
                    alert('Пользователь создан');
                }
            } catch (error) {
                console.error('Ошибка при сохранении пользователя:', error);
                alert(error.message || 'Ошибка при сохранении пользователя');
            }
        });

        // Обработчики закрытия
        [closeUserModalBtn, cancelUserBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                userModal.style.display = 'none';
                userForm.reset();
                currentUserId = null;
            });
        });
    }
}

/**
 * Настройка кнопок
 */
function setupButtons() {
    const addMaterialBtn = document.getElementById('addMaterialBtn');
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', () => {
            currentMaterialId = null;
            const materialModal = document.getElementById('materialModal');
            const materialModalTitle = document.getElementById('materialModalTitle');
            if (materialModal && materialModalTitle) {
                materialModalTitle.textContent = 'Добавление материала';
                materialModal.style.display = 'block';
            }
        });
    }

    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            currentUserId = null;
            const userModal = document.getElementById('userModal');
            const userModalTitle = document.getElementById('userModalTitle');
            if (userModal && userModalTitle) {
                userModalTitle.textContent = 'Добавление пользователя';
                userModal.style.display = 'block';
            }
        });
    }
}

/**
 * Создание категории
 */
async function createCategory(name) {
    try {
        await api.categories.create({ name });
        await loadCategories();
        alert('Категория создана');
    } catch (error) {
        console.error('Ошибка при создании категории:', error);
        alert(error.message || 'Ошибка при создании категории');
    }
}

/**
 * Редактирование категории
 */
function editCategory(category) {
    const newName = prompt('Введите новое название категории:', category.name);
    if (newName && newName !== category.name) {
        updateCategory(category.id, newName);
    }
}

/**
 * Обновление категории
 */
async function updateCategory(id, name) {
    try {
        await api.categories.update(id, { name });
        await loadCategories();
        alert('Категория обновлена');
    } catch (error) {
        console.error('Ошибка при обновлении категории:', error);
        alert(error.message || 'Ошибка при обновлении категории');
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
 * Редактирование материала
 */
function editMaterial(material) {
    currentMaterialId = material.id;
    const materialModal = document.getElementById('materialModal');
    const materialModalTitle = document.getElementById('materialModalTitle');
    
    if (materialModal && materialModalTitle) {
        materialModalTitle.textContent = 'Редактирование материала';
        
        // Заполняем форму данными
        document.getElementById('materialName').value = material.name;
        document.getElementById('materialCode').value = material.code;
        document.getElementById('materialUnit').value = material.unit;
        document.getElementById('materialCategory').value = material.category_id;
        document.getElementById('materialOverallWidth').value = material.overall_width || '';
        document.getElementById('materialWorkingWidth').value = material.working_width || '';
        
        materialModal.style.display = 'block';
    }
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
function editPrice(price) {
    const newPrice = prompt('Введите новую цену:', price.price);
    if (newPrice && !isNaN(newPrice)) {
        updatePrice(price.id, parseFloat(newPrice));
    }
}

/**
 * Обновление цены
 */
async function updatePrice(id, price) {
    try {
        await api.prices.update(id, { price });
        await loadPricelist();
        alert('Цена обновлена');
    } catch (error) {
        console.error('Ошибка при обновлении цены:', error);
        alert(error.message || 'Ошибка при обновлении цены');
    }
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
function editUser(user) {
    currentUserId = user.id;
    const userModal = document.getElementById('userModal');
    const userModalTitle = document.getElementById('userModalTitle');
    
    if (userModal && userModalTitle) {
        userModalTitle.textContent = 'Редактирование пользователя';
        
        // Заполняем форму данными
        document.getElementById('userLogin').value = user.login;
        document.getElementById('userName').value = user.name;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userPassword').value = '';
        
        userModal.style.display = 'block';
    }
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