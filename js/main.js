import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
(async function checkAuth() {
    if (window.location.pathname.includes('auth.html')) {
        return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('login', session.user.email.split('@')[0])
            .single();
            
        if (userError) throw userError;
        
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

            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await supabase.auth.signOut();
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
        console.error('Error getting user data:', error);
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    }
})();

export { supabase };