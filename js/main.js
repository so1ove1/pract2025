/**
 * main.js - Common functions for the application
 */

function addFaviconLinks() {
    const head = document.head || document.getElementsByTagName('head')[0];

    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.sizes = '180x180';
    appleTouchIcon.href = 'favicon/apple-touch-icon.png';
    head.appendChild(appleTouchIcon);

    const icon32 = document.createElement('link');
    icon32.rel = 'icon';
    icon32.type = 'image/png';
    icon32.sizes = '32x32';
    icon32.href = 'favicon/favicon-32x32.png';
    head.appendChild(icon32);

    const icon16 = document.createElement('link');
    icon16.rel = 'icon';
    icon16.type = 'image/png';
    icon16.sizes = '16x16';
    icon16.href = 'favicon/favicon-16x16.png';
    head.appendChild(icon16);

    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = 'favicon/site.webmanifest';
    head.appendChild(manifest);
}

document.addEventListener('DOMContentLoaded', addFaviconLinks);

// Base API URL
const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:3001/api'
    : '/api';

/**
 * Send request to API with improved error handling and debugging
 */
export async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Неверный ответ:', text);
        throw new Error(`Неверный тип ответа: ${contentType}`);
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Ошибка API');
    }

    return data;
}


/**
 * Format date
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');

    if (hours === '00' && minutes === '00') {
        return `${day}.${month}.${year}`;
    }

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Check authentication
(function checkAuth() {
    if (window.location.pathname.includes('auth.html')) {
        return;
    }

    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');

    if (!token || !currentUser) {
        window.location.href = 'auth.html';
        return;
    }

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

            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.location.href = 'auth.html';
            });
        }

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
        console.error('Error processing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    }
})();

// Export API functions
export const api = {
    auth: {
        getUsers: () => fetchAPI('/auth/users'),
        login: (credentials) => fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        validate: () => fetchAPI('/auth/validate'),
        createUser: (userData) => fetchAPI('/auth/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        updateUser: (id, userData) => fetchAPI(`/auth/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }),
        deleteUser: (id) => fetchAPI(`/auth/users/${id}`, {
            method: 'DELETE'
        })
    },

    categories: {
        getAll: () => fetchAPI('/materials/categories'),
        create: (data) => fetchAPI('/materials/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => fetchAPI(`/materials/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => fetchAPI(`/materials/categories/${id}`, {
            method: 'DELETE'
        })
    },

    materials: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return fetchAPI(`/materials${queryString ? '?' + queryString : ''}`);
        },
        create: (data) => fetchAPI('/materials', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => fetchAPI(`/materials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => fetchAPI(`/materials/${id}`, {
            method: 'DELETE'
        })
    },

    prices: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return fetchAPI(`/prices${queryString ? '?' + queryString : ''}`);
        },
        create: (data) => fetchAPI('/prices', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => fetchAPI(`/prices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => fetchAPI(`/prices/${id}`, {
            method: 'DELETE'
        })
    },

    calculations: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return fetchAPI(`/calculations${queryString ? '?' + queryString : ''}`);
        },
        create: (data) => fetchAPI('/calculations', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => fetchAPI(`/calculations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => fetchAPI(`/calculations/${id}`, {
            method: 'DELETE'
        })
    }
};
