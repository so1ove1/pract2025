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

    // Инициализация импорта/экспорта
    setupImportExport();
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
 * Настройка импорта и экспорта
 */
function setupImportExport() {
    const importBtn = document.getElementById('importPricelistBtn');
    const exportBtn = document.getElementById('exportPricelistBtn');

    if (importBtn) {
        importBtn.addEventListener('click', () => {
            // Создаем скрытый input для выбора файла
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.xlsx';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await importPricelist(file);
                }
                document.body.removeChild(fileInput);
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', exportPricelist);
    }

    // Добавляем кнопку скачивания шаблона
    const templateBtn = document.createElement('button');
    templateBtn.className = 'btn btn-secondary';
    templateBtn.innerHTML = '<i class="fas fa-download"></i> Скачать шаблон';
    templateBtn.addEventListener('click', downloadTemplate);
    
    // Вставляем кнопку рядом с кнопками импорта/экспорта
    const tabActions = document.querySelector('#pricelistTab .tab-actions');
    if (tabActions) {
        tabActions.appendChild(templateBtn);
    }
}

/**
 * Скачивание шаблона
 */
async function downloadTemplate() {
    try {
        const response = await fetch('/api/prices/template', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при скачивании шаблона');
        }

        // Получаем blob и создаем ссылку для скачивания
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'price_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Ошибка при скачивании шаблона:', error);
        alert('Ошибка при скачивании шаблона');
    }
}

/**
 * Импорт прайс-листа
 */
async function importPricelist(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Показываем индикатор загрузки
        const importBtn = document.getElementById('importPricelistBtn');
        const originalText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Импорт...';
        importBtn.disabled = true;

        const response = await fetch('/api/prices/import', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при импорте');
        }

        const result = await response.json();

        // Восстанавливаем кнопку
        importBtn.innerHTML = originalText;
        importBtn.disabled = false;

        // Показываем результаты импорта
        let message = `Импорт завершен!\n\nУспешно обработано: ${result.results.success} записей`;
        
        if (result.results.warnings.length > 0) {
            message += `\n\nПредупреждения:\n${result.results.warnings.join('\n')}`;
        }
        
        if (result.results.errors.length > 0) {
            message += `\n\nОшибки:\n${result.results.errors.join('\n')}`;
        }

        alert(message);

        // Перезагружаем данные
        await Promise.all([
            loadCategories(),
            loadMaterials(),
            loadPricelist()
        ]);
    } catch (error) {
        console.error('Ошибка при импорте:', error);
        
        // Восстанавливаем кнопку
        const importBtn = document.getElementById('importPricelistBtn');
        importBtn.innerHTML = '<i class="fas fa-file-import"></i> Импорт';
        importBtn.disabled = false;
        
        alert(error.message || 'Ошибка при импорте прайс-листа');
    }
}

/**
 * Экспорт прайс-листа
 */
async function exportPricelist() {
    try {
        const exportBtn = document.getElementById('exportPricelistBtn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Экспорт...';
        exportBtn.disabled = true;

        const response = await fetch('/api/prices/export', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при экспорте');
        }

        // Получаем blob и создаем ссылку для скачивания
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pricelist_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Восстанавливаем кнопку
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;

        alert('Прайс-лист успешно экспортирован');
    } catch (error) {
        console.error('Ошибка при экспорте:', error);
        
        // Восстанавливаем кнопку
        const exportBtn = document.getElementById('exportPricelistBtn');
        exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Экспорт';
        exportBtn.disabled = false;
        
        alert('Ошибка при экспорте прайс-листа');
    }
}

/**
 * Настройка фильтров прайс-листа
 */
function setupPricelistFilters() {
    const categorySelect = document.getElementById('pricelistCategory');
    const searchInput = document.getElementById('pricelistSearch');

    if (categorySelect) {
        // Заполняем категории
        categorySelect.innerHTML = '<option value="">Все категории</option>' +
            categories.map(category =>
                `<option value="${category.id}">${category.name}</option>`
            ).join('');

        categorySelect.addEventListener('change', () => {
            filterPricelist();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterPricelist();
        });
    }
}

/**
 * Фильтрация прайс-листа
 */
function filterPricelist() {
    const categorySelect = document.getElementById('pricelistCategory');
    const categoryId = categorySelect && categorySelect.value !== '' ? parseInt(categorySelect.value) : null;
    const searchTerm = document.getElementById('pricelistSearch').value.toLowerCase();

    console.log('Фильтрация: categoryId =', categoryId);

    const filteredPricelist = pricelist.filter(item => {
        const materialCategoryId = item.material?.category_id;

        console.log('Материал:', item.material);
        console.log('materialCategoryId =', materialCategoryId);

        const matchesCategory = categoryId === null || materialCategoryId == categoryId;

        const matchesSearch = !searchTerm ||
            (item.materialName && item.materialName.toLowerCase().includes(searchTerm)) ||
            (item.coating && item.coating.toLowerCase().includes(searchTerm)) ||
            (item.thickness && item.thickness.toString().includes(searchTerm));

        return matchesCategory && matchesSearch;
    });

    displayPricelist(filteredPricelist);
}




/**
 * Отображение отфильтрованного прайс-листа
 */
function displayPricelist(items) {
    const tbody = document.getElementById('pricelistTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center">Прайс-лист пуст</td></tr>
        `;
        return;
    }

    items.forEach(item => {
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

        tbody.appendChild(row);
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

            // Обработчик клика по названию категории
            const categoryName = item.querySelector('.category-name');
            if (categoryName) {
                categoryName.addEventListener('click', () => selectCategory(category.id));
            }

            // Обработчики кнопок редактирования и удаления
            const editBtn = item.querySelector('.edit-category');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editCategory(category);
                });
            }

            const deleteBtn = item.querySelector('.delete-category');
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
        alert(error.message || 'Ошибка при загрузке категорий');
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
        displayPricelist(pricelist);
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
                    await api.auth.updateUser(currentUserId, formData);
                    userModal.style.display = 'none';
                    userForm.reset();
                    await loadUsers();
                    alert('Пользователь обновлен');
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

    // Модальное окно для цен
    const priceModal = document.getElementById('priceModal');
    const priceForm = document.getElementById('priceForm');
    const closePriceModalBtn = document.getElementById('closePriceModalBtn');
    const cancelPriceBtn = document.getElementById('cancelPriceBtn');
    const savePriceBtn = document.getElementById('savePriceBtn');
    const addPriceItemBtn = document.getElementById('addPriceItemBtn');

    if (priceModal && priceForm && closePriceModalBtn && cancelPriceBtn && savePriceBtn && addPriceItemBtn) {
        // Обработчик открытия модального окна
        addPriceItemBtn.addEventListener('click', () => {
            currentPriceId = null;
            const priceModalTitle = document.getElementById('priceModalTitle');
            const priceMaterialSelect = document.getElementById('priceMaterial');

            if (priceModalTitle) {
                priceModalTitle.textContent = 'Добавление позиции';
            }

            // Заполняем список материалов
            if (priceMaterialSelect) {
                priceMaterialSelect.innerHTML = materials.map(material =>
                    `<option value="${material.id}">${material.name}</option>`
                ).join('');
            }

            priceForm.reset();
            priceModal.style.display = 'block';
        });

        // Обработчик сохранения цены
        savePriceBtn.addEventListener('click', async () => {
            const formData = {
                material_id: parseInt(document.getElementById('priceMaterial').value),
                coating: document.getElementById('priceCoating').value.trim(),
                thickness: parseFloat(document.getElementById('priceThickness').value),
                price: parseFloat(document.getElementById('priceValue').value),
                date: new Date().toISOString()
            };

            if (!formData.material_id || !formData.coating || isNaN(formData.thickness) || isNaN(formData.price)) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            try {
                if (currentPriceId) {
                    await api.prices.update(currentPriceId, formData);
                } else {
                    await api.prices.create(formData);
                }

                priceModal.style.display = 'none';
                priceForm.reset();
                currentPriceId = null;
                await loadPricelist();
                alert(currentPriceId ? 'Позиция обновлена' : 'Позиция добавлена');
            } catch (error) {
                console.error('Ошибка при сохранении позиции:', error);
                alert(error.message || 'Ошибка при сохранении позиции');
            }
        });

        // Обработчики закрытия
        [closePriceModalBtn, cancelPriceBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                priceModal.style.display = 'none';
                priceForm.reset();
                currentPriceId = null;
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
        if (!name.trim()) {
            throw new Error('Название категории не может быть пустым');
        }

        await api.categories.create({ name: name.trim() });
        await loadCategories();
        return true;
    } catch (error) {
        console.error('Ошибка при создании категории:', error);
        alert(error.message || 'Ошибка при создании категории');
        return false;
    }
}

/**
 * Редактирование категории
 */
function editCategory(category) {
    const categoryModal = document.getElementById('categoryModal');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryModalTitle = document.getElementById('categoryModalTitle');

    if (!categoryModal || !categoryNameInput || !categoryModalTitle) return;

    currentCategoryId = category.id;
    categoryModalTitle.textContent = 'Редактирование категории';
    categoryNameInput.value = category.name;
    categoryModal.style.display = 'block';
}

/**
 * Удаление категории
 */
async function deleteCategory(id) {
    try {
        if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
            return;
        }

        await api.categories.delete(id);
        await loadCategories();
        await loadMaterials(); // Перезагружаем материалы, так как они могут быть связаны с удаленной категорией
        alert('Категория успешно удалена');
    } catch (error) {
        console.error('Ошибка при удалении категории:', error);
        alert(error.message || 'Ошибка при удалении категории');
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