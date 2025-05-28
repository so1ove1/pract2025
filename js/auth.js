/**
 * auth.js - Скрипт для страницы авторизации
 */

import { fetchData } from './main.js';

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
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // Если пользователь авторизован, перенаправляем на главную
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем список пользователей для выпадающего списка
    try {
        const users = await fetchData('users');
        
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
            // Имитация запроса на авторизацию
            const user = await fetchData('users/authenticate', { login, password });
            
            if (user) {
                // Сохраняем пользователя в localStorage
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Перенаправляем на главную страницу
                window.location.href = 'index.html';
            } else {
                authError.textContent = 'Неверный логин или пароль';
            }
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            authError.textContent = 'Ошибка авторизации. Пожалуйста, попробуйте позже.';
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