/**
 * auth.js - Скрипт для страницы авторизации
 */

import { api } from './main.js';

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
        const users = await api.auth.getUsers();
        
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
            const response = await api.auth.login({ login, password });
            
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
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