document.addEventListener('DOMContentLoaded', () => {
    // Инициализация формы авторизации
    initAuthForm();
    
    // Настройка переключателя видимости пароля
    setupPasswordToggle();
});

/**
 * Инициализация формы авторизации
 */
async function initAuthForm() {
    const userSelect = document.getElementById('userSelect');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    
    // Проверяем, есть ли текущий пользователь
    const token = localStorage.getItem('token');
    if (token) {
        // Если пользователь авторизован, перенаправляем на главную
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем список пользователей для выпадающего списка
    try {
        const response = await fetch('/api/auth/users');
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки пользователей');
        }
        
        const users = await response.json();
        
        // Заполняем выпадающий список
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.login;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        authError.textContent = 'Ошибка загрузки данных. Пожалуйста, обновите страницу.';
    }
    
    // Обработчик отправки формы
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const login = userSelect.value;
        const password = document.getElementById('password').value;
        
        if (!login || !password) {
            authError.textContent = 'Пожалуйста, заполните все поля';
            return;
        }
        
        // Очищаем сообщение об ошибке
        authError.textContent = '';
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, password }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка авторизации');
            }
            
            const data = await response.json();
            
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Перенаправляем на главную страницу
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            authError.textContent = error.message || 'Ошибка авторизации. Пожалуйста, попробуйте позже.';
        }
    });
}

/**
 * Настройка переключателя видимости пароля
 */
function setupPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');
    
    toggleButton.addEventListener('click', () => {
        // Изменяем тип поля ввода
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Изменяем иконку
        const iconClass = type === 'password' ? 'fa-eye' : 'fa-eye-slash';
        toggleButton.querySelector('i').className = `fas ${iconClass}`;
    });
}