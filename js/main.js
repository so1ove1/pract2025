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

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.location.href = 'auth.html';
                throw new Error('Session expired. Please log in again.');
            }
            throw new Error(error.message || 'Server error');
        }

        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        if (error.message.includes('Session expired')) {
            alert('Your session has expired. Please log in again.');
        }
        throw error;
    }
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
                
                    
                

                
                    ${user.name}
                    ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                

                
                    
                    Выйти
                
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

        // Validate token on page load
        fetchAPI('/auth/validate').catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
        });
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
        createUser: (userData) => fetchAPI('/auth/users', {
            method: 'POST',
            body: JSON.stringify(userData)
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