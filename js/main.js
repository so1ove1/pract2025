/**
 * main.js - Общие функции для всего приложения
 */

// Export functions that are used in other modules
export function fetchData(endpoint, params = {}) {
    // Имитация задержки запроса
    return new Promise(async (resolve) => {
        await new Promise(r => setTimeout(r, 300));
        
        // Базовые данные для имитации API
        const mockData = {
            // Пользователи
            'users': [
                { id: 1, login: 'admin', name: 'Администратор', password: 'admin', role: 'admin', lastLogin: '2025-06-10 09:15:22' },
                { id: 2, login: 'manager', name: 'Иванов Иван', password: '12345', role: 'user', lastLogin: '2025-06-09 14:30:45' },
                { id: 3, login: 'user', name: 'Петров Петр', password: 'user', role: 'user', lastLogin: '2025-06-08 16:40:12' }
            ],
            
            // Категории материалов
            'categories': [
                { id: 1, name: 'Профлист' },
                { id: 2, name: 'Металлочерепица' },
                { id: 3, name: 'Штакетник' },
                { id: 4, name: 'Сайдинг' },
                { id: 5, name: 'Доборные элементы' }
            ],
            
            // Материалы с добавленными полями ширины
            'materials': [
                { 
                    id: 1, 
                    name: 'Профлист C8', 
                    code: 'C8', 
                    unit: 'м²', 
                    categoryId: 1,
                    overallWidth: 1.2,
                    workingWidth: 1.15
                },
                { 
                    id: 2, 
                    name: 'Профлист C10', 
                    code: 'C10', 
                    unit: 'м²', 
                    categoryId: 1,
                    overallWidth: 1.15,
                    workingWidth: 1.10
                },
                { 
                    id: 3, 
                    name: 'Профлист C21', 
                    code: 'C21', 
                    unit: 'м²', 
                    categoryId: 1,
                    overallWidth: 1.05,
                    workingWidth: 1.00
                },
                { id: 4, name: 'Металлочерепица Монтеррей', code: 'MCH-M', unit: 'м²', categoryId: 2 },
                { id: 5, name: 'Металлочерепица Супермонтеррей', code: 'MCH-SM', unit: 'м²', categoryId: 2 },
                { id: 6, name: 'Штакетник прямоугольный', code: 'SHTP', unit: 'шт', categoryId: 3 },
                { id: 7, name: 'Штакетник закругленный', code: 'SHTZ', unit: 'шт', categoryId: 3 },
                { id: 8, name: 'Сайдинг металлический', code: 'SM', unit: 'м²', categoryId: 4 },
                { id: 9, name: 'Сайдинг виниловый', code: 'SV', unit: 'м²', categoryId: 4 },
                { id: 10, name: 'Планка конька', code: 'PK', unit: 'м.п.', categoryId: 5 },
                { id: 11, name: 'Планка торцевая', code: 'PT', unit: 'м.п.', categoryId: 5 }
            ],
            
            // Прайс-лист
            'pricelist': [
                { id: 1, materialId: 1, coating: 'Полиэстер', thickness: 0.45, price: 650, date: '2025-05-15' },
                { id: 2, materialId: 1, coating: 'Полиэстер', thickness: 0.5, price: 720, date: '2025-05-15' },
                { id: 3, materialId: 2, coating: 'Полиэстер', thickness: 0.45, price: 670, date: '2025-05-15' },
                { id: 4, materialId: 2, coating: 'Полиэстер', thickness: 0.5, price: 740, date: '2025-05-15' },
                { id: 5, materialId: 3, coating: 'Полиэстер', thickness: 0.5, price: 750, date: '2025-05-15' },
                { id: 6, materialId: 3, coating: 'Полиэстер', thickness: 0.7, price: 920, date: '2025-05-15' },
                { id: 7, materialId: 4, coating: 'Полиэстер', thickness: 0.5, price: 780, date: '2025-05-15' },
                { id: 8, materialId: 5, coating: 'Полиэстер', thickness: 0.5, price: 820, date: '2025-05-15' },
                { id: 9, materialId: 6, coating: 'Полиэстер', thickness: 0.45, price: 95, date: '2025-05-15' },
                { id: 10, materialId: 7, coating: 'Полиэстер', thickness: 0.45, price: 105, date: '2025-05-15' },
                { id: 11, materialId: 8, coating: 'Полиэстер', thickness: 0.45, price: 580, date: '2025-05-15' },
                { id: 12, materialId: 9, coating: 'ПВХ', thickness: 1.0, price: 450, date: '2025-05-15' },
                { id: 13, materialId: 10, coating: 'Полиэстер', thickness: 0.45, price: 340, date: '2025-05-15' },
                { id: 14, materialId: 11, coating: 'Полиэстер', thickness: 0.45, price: 280, date: '2025-05-15' }
            ]
        };
        
        let result = null;

        // Обработка запроса в зависимости от эндпоинта
        switch (endpoint) {
            case 'users':
                result = mockData.users.map(user => {
                    const { password, ...rest } = user;
                    return rest;
                });
                break;
                
            case 'users/authenticate':
                const user = mockData.users.find(u => 
                    u.login === params.login && u.password === params.password
                );
                
                if (user) {
                    const { password, ...userInfo } = user;
                    result = userInfo;
                }
                break;
                
            case 'categories':
                result = mockData.categories;
                break;
                
            case 'materials':
                result = [...mockData.materials];
                
                if (params.categoryId) {
                    result = result.filter(m => m.categoryId === params.categoryId);
                }
                break;
                
            case 'pricelist':
                result = mockData.pricelist.map(item => {
                    const material = mockData.materials.find(m => m.id === item.materialId);
                    const category = mockData.categories.find(c => c.id === material.categoryId);
                    return {
                        ...item,
                        materialName: material.name,
                        categoryName: category.name
                    };
                });
                
                if (params.categoryId) {
                    const filteredMaterialIds = mockData.materials
                        .filter(m => m.categoryId === params.categoryId)
                        .map(m => m.id);
                        
                    result = result.filter(item => 
                        filteredMaterialIds.includes(item.materialId)
                    );
                }
                break;
                
            default:
                console.error('Неизвестный endpoint:', endpoint);
        }

        resolve(result);
    });
}

/**
 * Форматирование даты
 * @param {string} dateString - Дата в формате строки
 * @returns {string} - Отформатированная дата
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Если время 00:00, то выводим только дату
    if (hours === '00' && minutes === '00') {
        return `${day}.${month}.${year}`;
    }
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Форматирование числа в денежный формат
 * @param {number} value - Число
 * @returns {string} - Отформатированное число
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Проверка авторизации
(function checkAuth() {
    // Если мы находимся на странице auth.html, не перенаправляем
    if (window.location.pathname.includes('auth.html')) {
        return;
    }

    const currentUser = localStorage.getItem('currentUser');
    
    // Если пользователь не авторизован, перенаправляем на страницу авторизации
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Иначе отображаем информацию о пользователе
    try {
        const user = JSON.parse(currentUser);
        const userInfoContainer = document.getElementById('userInfoContainer');
        
        if (userInfoContainer) {
            userInfoContainer.innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="user-name">${user.name}</span>
                    <span class="user-role">${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                </div>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Выйти</span>
                </button>
            `;

            // Добавляем обработчик клика для кнопки выхода
            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                window.location.href = 'auth.html';
            });
        }
        
        // Скрываем пункт Администрирование для обычных пользователей
        if (user.role !== 'admin') {
            const adminNavLink = document.getElementById('adminNavLink');
            if (adminNavLink) {
                adminNavLink.parentElement.style.display = 'none';
            }
            
            const adminCard = document.getElementById('adminCard');
            if (adminCard) {
                adminCard.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка при обработке данных пользователя:', error);
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    }
})();