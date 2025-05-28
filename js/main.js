/**
 * main.js - Common functions for the application
 */

// Base API URL
const API_URL = 'http://localhost:3001/api';

/**
 * Send request to API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise} - Request result
 */
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
            throw new Error('Authentication required');
        }
        
        const error = await response.json();
        throw new Error(error.message || 'Server error');
    }

    return response.json();
}

/**
 * Format date
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
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
        })
    },

    categories: {
        getAll: () => fetchAPI('/materials/categories')
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
        delete: (id) => fetchAPI(`/calculations/${id}`, {
            method: 'DELETE'
        })
    }
};