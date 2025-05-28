/**
 * auth.js - Скрипт для страницы авторизации
 */

document.addEventListener('DOMContentLoaded', () => {
    initAuthForm();
    setupPasswordToggle();
});

async function initAuthForm() {
    const userSelect = document.getElementById('userSelect');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем список пользователей
    try {
        const response = await fetch('/api/auth/users');
        const users = await response.json();
        
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
    
    // Обработка отправки формы
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const login = userSelect.value;
        const password = document.getElementById('password').value;
        
        if (!login || !password) {
            authError.textContent = 'Пожалуйста, заполните все поля';
            return;
        }
        
        authError.textContent = '';
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }
            
            const data = await response.json();
            
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Перенаправляем на главную
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            authError.textContent = 'Неверный логин или пароль';
        }
    });
}

function setupPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');
    
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const iconClass = type === 'password' ? 'fa-eye' : 'fa-eye-slash';
        toggleButton.querySelector('i').className = `fas ${iconClass}`;
    });
}