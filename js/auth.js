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
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const users = await api.auth.getUsers();
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.login;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        authError.textContent = 'Error loading users. Please refresh the page.';
    }
    
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const login = userSelect.value;
        const password = document.getElementById('password').value;
        
        if (!login || !password) {
            authError.textContent = 'Please fill in all fields';
            return;
        }
        
        authError.textContent = '';
        
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Authentication error:', error);
            authError.textContent = error.message || 'Authentication failed';
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