import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

document.addEventListener('DOMContentLoaded', () => {
    initAuthForm();
    setupPasswordToggle();
});

async function initAuthForm() {
    const userSelect = document.getElementById('userSelect');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    
    // Check if user is already authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load users for dropdown
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('login, name')
            .order('name');
            
        if (error) throw error;
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.login;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        authError.textContent = 'Error loading data. Please refresh the page.';
    }
    
    // Handle form submission
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
            const { data, error } = await supabase.auth.signInWithPassword({
                email: `${login}@bratskprofil.ru`,
                password: password
            });
            
            if (error) throw error;
            
            // Get user details
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('login', login)
                .single();
                
            if (userError) throw userError;
            
            // Redirect to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Authentication error:', error);
            authError.textContent = 'Invalid login or password';
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