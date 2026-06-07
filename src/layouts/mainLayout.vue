<script setup>
import { useAuthStore } from "../stores/authStores";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const logout = async () => {
    await authStore.logout();
    router.push("/login");
};
</script>

<template>
    <div class="wrap">
        <aside class="sidebar">
            <div class="sidebar-logo">
                <h2>⚙️ Oficina Pro</h2>
                <p>Painel de controle</p>
            </div>
            <nav class="nav">
                <RouterLink to="/home" class="nav-item">🚗 Carros para arrumar</RouterLink>
                <RouterLink to="/ordens" class="nav-item">📋 Ordens de serviço</RouterLink>
                <RouterLink to="/orcamentos" class="nav-item">💰 Orçamentos</RouterLink>
            </nav>
            <div class="sidebar-bottom">
                <button class="btn-logout" @click="logout">🚪 Sair</button>
            </div>
        </aside>

        <div class="main">
            <RouterView />
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Sora', sans-serif;
}

.wrap {
    display: flex;
    min-height: 100vh;
    background: #0b1e35;
}

.sidebar {
    width: 220px;
    min-width: 220px;
    background: #0a1929;
    border-right: 1px solid #1e3d5c;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 0;
}

.sidebar-logo {
    padding: 0 1.25rem 1.5rem;
    border-bottom: 1px solid #1e3d5c;
}

.sidebar-logo h2 {
    font-size: 1rem;
    font-weight: 600;
    color: #e8f1fb;
}

.sidebar-logo p {
    font-size: .72rem;
    color: #3d6a8a;
    margin-top: 2px;
}

.nav {
    padding: 1rem 0;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: .65rem;
    padding: .65rem 1.25rem;
    font-size: .82rem;
    color: #5a8ab0;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all .15s;
    text-decoration: none;
}

.nav-item:hover {
    color: #b8d8f8;
    background: rgba(30, 61, 92, .3);
}

.nav-item.router-link-active {
    color: #7eb8f7;
    background: rgba(30, 93, 165, .15);
    border-left-color: #378add;
}

.sidebar-bottom {
    padding: 1rem 1.25rem;
    border-top: 1px solid #1e3d5c;
}

.btn-logout {
    width: 100%;
    padding: .6rem .9rem;
    background: rgba(162, 45, 45, .1);
    border: 1px solid rgba(162, 45, 45, .25);
    border-radius: 8px;
    color: #f09595;
    font-size: .8rem;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
}

.btn-logout:hover {
    background: rgba(162, 45, 45, .2);
}

.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
</style>