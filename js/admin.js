import { fetchData, formatDate, formatCurrency } from './main.js';

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
 * Настройка вкладок администрирования
 */
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('.admin-tabs .tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Убираем активный класс у всех кнопок и вкладок
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Добавляем активный класс выбранной вкладке
            button.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}

/**
 * Настройка модальных окон
 */
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeButtons = modal.querySelectorAll('.close-btn, [id^="close"], [id^="cancel"]');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
        
        // Закрытие по клику вне модального окна
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Проверка прав доступа
 */
function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('У вас нет доступа к этой странице');
        window.location.href = 'index.html';
    }
}

/**
 * Загрузка категорий
 */
async function loadCategories() {
    try {
        categories = await fetchData('categories');
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
        
        // Заполняем выпадающие списки в модальных окнах
        const materialCategorySelect = document.getElementById('materialCategory');
        const pricelistCategorySelect = document.getElementById('pricelistCategory');
        
        if (materialCategorySelect) {
            materialCategorySelect.innerHTML = '';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                materialCategorySelect.appendChild(option);
            });
        }
        
        if (pricelistCategorySelect) {
            pricelistCategorySelect.innerHTML = '<option value="">Все категории</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                pricelistCategorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
    }
}

/**
 * Выбор категории
 * @param {number|string} categoryId - Идентификатор категории или пустая строка для всех категорий
 */
function selectCategory(categoryId) {
    // Выделяем выбранную категорию
    document.querySelectorAll('#categoriesList li').forEach(item => {
        if (item.getAttribute('data-category-id') == categoryId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Фильтруем материалы по выбранной категории
    loadMaterials(categoryId ? parseInt(categoryId) : null);
}

/**
 * Загрузка материалов
 * @param {number|null} categoryId - Идентификатор категории для фильтрации
 */
async function loadMaterials(categoryId = null) {
    try {
        const params = {};
        
        if (categoryId) {
            params.categoryId = categoryId;
        }
        
        materials = await fetchData('materials', params);
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
        pricelist = await fetchData('pricelist');
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
        users = await fetchData('users');
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

/**
 * Настройка кнопок
 */
function setupButtons() {
    // Кнопки для материалов
    const addMaterialCategoryBtn = document.getElementById('addMaterialCategoryBtn');
    const addMaterialBtn = document.getElementById('addMaterialBtn');
    
    if (addMaterialCategoryBtn) {
        addMaterialCategoryBtn.addEventListener('click', addCategory);
    }
    
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', addMaterial);
    }
    
    // Кнопки для прайс-листа
    const addPriceItemBtn = document.getElementById('addPriceItemBtn');
    const importPricelistBtn = document.getElementById('importPricelistBtn');
    const exportPricelistBtn = document.getElementById('exportPricelistBtn');
    
    if (addPriceItemBtn) {
        addPriceItemBtn.addEventListener('click', addPrice);
    }
    
    if (importPricelistBtn) {
        importPricelistBtn.addEventListener('click', importPricelist);
    }
    
    if (exportPricelistBtn) {
        exportPricelistBtn.addEventListener('click', exportPricelist);
    }
    
    // Кнопки для пользователей
    const addUserBtn = document.getElementById('addUserBtn');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', addUser);
    }
    
    // Кнопки сохранения в модальных окнах
    const saveMaterialBtn = document.getElementById('saveMaterialBtn');
    const saveUserBtn = document.getElementById('saveUserBtn');
    
    if (saveMaterialBtn) {
        saveMaterialBtn.addEventListener('click', saveMaterial);
    }
    
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUser);
    }
}

/**
 * Добавление категории
 */
function addCategory() {
    const categoryName = prompt('Введите название новой категории:');
    
    if (categoryName) {
        // В реальном приложении здесь был бы запрос на сервер
        const newCategory = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            name: categoryName
        };
        
        categories.push(newCategory);
        
        // Обновляем список категорий
        loadCategories();
    }
}

/**
 * Редактирование категории
 * @param {number} categoryId - Идентификатор категории
 */
function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
        const newName = prompt('Введите новое название категории:', category.name);
        
        if (newName && newName !== category.name) {
            // В реальном приложении здесь был бы запрос на сервер
            category.name = newName;
            
            // Обновляем список категорий
            loadCategories();
        }
    }
}

/**
 * Удаление категории
 * @param {number} categoryId - Идентификатор категории
 */
function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
        // Проверяем, есть ли материалы в этой категории
        const hasMaterials = materials.some(m => m.categoryId === categoryId);
        
        if (hasMaterials) {
            alert(`Невозможно удалить категорию "${category.name}", так как в ней есть материалы`);
            return;
        }
        
        if (confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
            // В реальном приложении здесь был бы запрос на сервер
            const index = categories.findIndex(c => c.id === categoryId);
            
            if (index !== -1) {
                categories.splice(index, 1);
                
                // Обновляем список категорий
                loadCategories();
            }
        }
    }
}

/**
 * Добавление материала
 */
function addMaterial() {
    // Открываем модальное окно
    const modal = document.getElementById('materialModal');
    const modalTitle = document.getElementById('materialModalTitle');
    const form = document.getElementById('materialForm');
    
    // Сбрасываем форму
    form.reset();
    
    // Устанавливаем заголовок
    modalTitle.textContent = 'Добавление материала';
    
    // Сбрасываем текущий идентификатор
    currentMaterialId = null;
    
    // Отображаем модальное окно
    modal.style.display = 'block';
}

/**
 * Редактирование материала
 * @param {number} materialId - Идентификатор материала
 */
function editMaterial(materialId) {
    const material = materials.find(m => m.id === materialId);
    
    if (material) {
        // Открываем модальное окно
        const modal = document.getElementById('materialModal');
        const modalTitle = document.getElementById('materialModalTitle');
        const form = document.getElementById('materialForm');
        
        // Устанавливаем заголовок
        modalTitle.textContent = 'Редактирование материала';
        
        // Заполняем поля формы
        document.getElementById('materialName').value = material.name;
        document.getElementById('materialCode').value = material.code;
        document.getElementById('materialUnit').value = material.unit;
        document.getElementById('materialCategory').value = material.categoryId;
        document.getElementById('materialOverallWidth').value = material.overallWidth || '';
        document.getElementById('materialWorkingWidth').value = material.workingWidth || '';
        
        // Сохраняем текущий идентификатор
        currentMaterialId = materialId;
        
        // Отображаем модальное окно
        modal.style.display = 'block';
    }
}

/**
 * Сохранение материала
 */
function saveMaterial() {
    const form = document.getElementById('materialForm');
    
    // Проверяем валидность формы
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Получаем данные из формы
    const name = document.getElementById('materialName').value;
    const code = document.getElementById('materialCode').value;
    const unit = document.getElementById('materialUnit').value;
    const categoryId = parseInt(document.getElementById('materialCategory').value);
    const overallWidth = parseFloat(document.getElementById('materialOverallWidth').value);
    const workingWidth = parseFloat(document.getElementById('materialWorkingWidth').value);
    
    // Проверяем корректность значений ширины
    if (isNaN(overallWidth) || isNaN(workingWidth) || overallWidth <= 0 || workingWidth <= 0) {
        alert('Пожалуйста, укажите корректные значения для габаритной и монтажной ширины');
        return;
    }
    
    // Если это редактирование существующего материала
    if (currentMaterialId) {
        const material = materials.find(m => m.id === currentMaterialId);
        
        if (material) {
            // Обновляем данные
            material.name = name;
            material.code = code;
            material.unit = unit;
            material.categoryId = categoryId;
            material.overallWidth = overallWidth;
            material.workingWidth = workingWidth;
        }
    } else {
        // Создаем новый материал
        const newMaterial = {
            id: materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1,
            name,
            code,
            unit,
            categoryId,
            overallWidth,
            workingWidth
        };
        
        materials.push(newMaterial);
    }
    
    // Закрываем модальное окно
    document.getElementById('materialModal').style.display = 'none';
    
    // Обновляем список материалов
    loadMaterials();
}

/**
 * Удаление материала
 * @param {number} materialId - Идентификатор материала
 */
function deleteMaterial(materialId) {
    const material = materials.find(m => m.id === materialId);
    
    if (material) {
        // Проверяем, есть ли позиции в прайс-листе для этого материала
        const hasPriceItems = pricelist.some(p => p.materialId === materialId);
        
        if (hasPriceItems) {
            alert(`Невозможно удалить материал "${material.name}", так как он используется в прайс-листе`);
            return;
        }
        
        if (confirm(`Вы уверены, что хотите удалить материал "${material.name}"?`)) {
            // В реальном приложении здесь был бы запрос на сервер
            const index = materials.findIndex(m => m.id === materialId);
            
            if (index !== -1) {
                materials.splice(index, 1);
                
                // Обновляем список материалов
                loadMaterials();
            }
        }
    }
}

/**
 * Добавление позиции в прайс-лист
 */
function addPrice() {
    // Здесь должен быть код для добавления позиции в прайс-лист
    alert('Функция добавления позиции в прайс-лист находится в разработке');
}

/**
 * Редактирование позиции в прайс-листе
 * @param {number} priceId - Идентификатор позиции
 */
function editPrice(priceId) {
    // Здесь должен быть код для редактирования позиции в прайс-листе
    alert('Функция редактирования позиции в прайс-листе находится в разработке');
}

/**
 * Удаление позиции из прайс-листа
 * @param {number} priceId - Идентификатор позиции
 */
function deletePrice(priceId) {
    const priceItem = pricelist.find(p => p.id === priceId);
    
    if (priceItem) {
        if (confirm(`Вы уверены, что хотите удалить позицию из прайс-листа?`)) {
            // В реальном приложении здесь был бы запрос на сервер
            const index = pricelist.findIndex(p => p.id === priceId);
            
            if (index !== -1) {
                pricelist.splice(index, 1);
                
                // Обновляем прайс-лист
                loadPricelist();
            }
        }
    }
}

/**
 * Импорт прайс-листа
 */
function importPricelist() {
    alert('Функция импорта прайс-листа находится в разработке');
}

/**
 * Экспорт прайс-листа
 */
function exportPricelist() {
    alert('Функция экспорта прайс-листа находится в разработке');
}

/**
 * Добавление пользователя
 */
function addUser() {
    // Открываем модальное окно
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    
    // Сбрасываем форму
    form.reset();
    
    // Устанавливаем заголовок
    modalTitle.textContent = 'Добавление пользователя';
    
    // Сбрасываем текущий идентификатор
    currentUserId = null;
    
    // Отображаем модальное окно
    modal.style.display = 'block';
}

/**
 * Редактирование пользователя
 * @param {number} userId - Идентификатор пользователя
 */
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    
    if (user) {
        // Открываем модальное окно
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        
        // Устанавливаем заголовок
        modalTitle.textContent = 'Редактирование пользователя';
        
        // Заполняем поля формы
        document.getElementById('userLogin').value = user.login;
        document.getElementById('userName').value = user.name;
        document.getElementById('userPassword').value = ''; // Не отображаем пароль
        document.getElementById('userRole').value = user.role;
        
        // Сохраняем текущий идентификатор
        currentUserId = userId;
        
        // Отображаем модальное окно
        modal.style.display = 'block';
    }
}

/**
 * Сохранение пользователя
 */
function saveUser() {
    const form = document.getElementById('userForm');
    
    // Проверяем валидность формы
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Получаем данные из формы
    const login = document.getElementById('userLogin').value;
    const name = document.getElementById('userName').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    
    // Проверяем, существует ли пользователь с таким логином
    const existingUser = users.find(u => u.login === login && u.id !== currentUserId);
    
    if (existingUser) {
        alert(`Пользователь с логином "${login}" уже существует`);
        return;
    }
    
    // Если это редактирование существующего пользователя
    if (currentUserId) {
        const user = users.find(u => u.id === currentUserId);
        
        if (user) {
            // Обновляем данные
            user.login = login;
            user.name = name;
            
            // Обновляем пароль только если он был изменен
            if (password) {
                user.password = password;
            }
            
            user.role = role;
        }
    } else {
        // Создаем нового пользователя
        if (!password) {
            alert('Пожалуйста, укажите пароль');
            return;
        }
        
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            login,
            name,
            password,
            role,
            lastLogin: null
        };
        
        users.push(newUser);
    }
    
    // Закрываем модальное окно
    document.getElementById('userModal').style.display = 'none';
    
    // Обновляем список пользователей
    loadUsers();
}

/**
 * Удаление пользователя
 * @param {number} userId - Идентификатор пользователя
 */
function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    
    if (user) {
        // Проверяем, не удаляет ли пользователь самого себя
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (currentUser.id === userId) {
            alert('Вы не можете удалить собственную учетную запись');
            return;
        }
        
        if (confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?`)) {
            // В реальном приложении здесь был бы запрос на сервер
            const index = users.findIndex(u => u.id === userId);
            
            if (index !== -1) {
                users.splice(index, 1);
                
                // Обновляем список пользователей
                loadUsers();
            }
        }
    }
}