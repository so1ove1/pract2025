import { api } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuthForm();
    setupPasswordToggle();
});

async function initAuthForm() {
    const userSelect = document.getElementById('userSelect');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await api.auth.validate();
            window.location.href = 'index.html';
            return;
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
        }
    }
    
    try {
        const users = await api.auth.getUsers();
        userSelect.innerHTML = '<option value="" disabled selected>Выберите пользователя</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.login;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        authError.textContent = 'Ошибка загрузки пользователей. Пожалуйста, обновите страницу.';
    }
    
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
            const response = await api.auth.login({ login, password });
            
            if (response && response.token && response.user) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('currentUser', JSON.stringify(response.user));
                window.location.href = 'index.html';
            } else {
                throw new Error('Неверный формат ответа от сервера');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            authError.textContent = error.message || 'Ошибка аутентификации';
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