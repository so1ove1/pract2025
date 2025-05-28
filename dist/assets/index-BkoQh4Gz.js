(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function s(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(e){if(e.ep)return;e.ep=!0;const t=s(e);fetch(e.href,t)}})();(function(){if(window.location.pathname.includes("auth.html"))return;const n=localStorage.getItem("token"),s=localStorage.getItem("currentUser");if(!n||!s){window.location.href="auth.html";return}try{const r=JSON.parse(s),e=document.getElementById("userInfoContainer");if(e&&(e.innerHTML=`
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="user-name">${r.name}</span>
                    <span class="user-role">${r.role==="admin"?"Администратор":"Пользователь"}</span>
                </div>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Выйти</span>
                </button>
            `,document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("token"),localStorage.removeItem("currentUser"),window.location.href="auth.html"})),r.role!=="admin"){const t=document.getElementById("adminNavLink");t&&(t.parentElement.style.display="none");const o=document.getElementById("adminCard");o&&(o.style.display="none")}}catch(r){console.error("Ошибка при обработке данных пользователя:",r),localStorage.removeItem("token"),localStorage.removeItem("currentUser"),window.location.href="auth.html"}})();
