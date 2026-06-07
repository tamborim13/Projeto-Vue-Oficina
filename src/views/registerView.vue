<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/authStores";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const nome = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const erroLocal = ref("");

const handleRegister = async () => {
    erroLocal.value = "";

    if (password.value !== confirmPassword.value) {
        erroLocal.value = "As senhas não coincidem.";
        return;
    }

    await authStore.register(email.value, password.value);
    if (!authStore.error) {
        router.push("/home");
    }
};
</script>

<template>
    <div class="page">
        <div class="modal">
            <div class="modal-header">
                <div class="logo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="#1e3a5f" />
                        <path d="M8 22 L16 10 L24 22" stroke="#7eb8f7" stroke-width="2.5" stroke-linecap="round"
                            stroke-linejoin="round" fill="none" />
                        <path d="M11 18 L21 18" stroke="#7eb8f7" stroke-width="2.5" stroke-linecap="round" />
                    </svg>
                </div>
                <h1>Criar conta</h1>
                <p>Preencha os dados para se cadastrar</p>
            </div>

            <div class="modal-body">
                <div class="field">
                    <label for="nome">Nome completo</label>
                    <input id="nome" v-model="nome" type="text" placeholder="João Silva" />
                </div>

                <div class="field">
                    <label for="email">E-mail</label>
                    <input id="email" v-model="email" type="email" placeholder="seu@email.com" />
                </div>

                <div class="field">
                    <label for="password">Senha</label>
                    <input id="password" v-model="password" type="password" placeholder="••••••••" />
                </div>

                <div class="field">
                    <label for="confirmPassword">Confirmar senha</label>
                    <input id="confirmPassword" v-model="confirmPassword" type="password" placeholder="••••••••"
                        @keyup.enter="handleRegister" />
                </div>

                <p v-if="erroLocal || authStore.error" class="error-msg">
                    {{ erroLocal || authStore.error }}
                </p>

                <button class="btn-entrar" :disabled="authStore.loading" @click="handleRegister">
                    <span v-if="authStore.loading">Criando conta...</span>
                    <span v-else>Criar conta</span>
                </button>

                <p class="register-link">
                    Já tem uma conta?
                    <RouterLink to="/login">Entrar</RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');

* {
    box-sizing: border-box;
    font-family: 'Sora', sans-serif;
}

.page {
    min-height: 100vh;
    background: #0b1e35;
    background-image:
        radial-gradient(ellipse at 20% 50%, #0f2d4f 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, #112944 0%, transparent 50%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}

.modal {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    padding: 2.5rem 2rem;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.modal-header {
    text-align: center;
    margin-bottom: 2rem;
}

.logo {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
}

.modal-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #e8f1fb;
    margin: 0 0 0.4rem;
    letter-spacing: -0.3px;
}

.modal-header p {
    font-size: 0.85rem;
    color: #5a8ab0;
    margin: 0;
}

.modal-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.field label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #7eb8f7;
    letter-spacing: 0.3px;
}

.field input {
    background: #0b1a2d;
    border: 1px solid #1e3d5c;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    color: #d0e8ff;
    outline: none;
    transition: border-color 0.2s;
    font-family: 'Sora', sans-serif;
}

.field input::placeholder {
    color: #2d5070;
}

.field input:focus {
    border-color: #378add;
}

.error-msg {
    font-size: 0.8rem;
    color: #f09595;
    background: rgba(226, 75, 74, 0.1);
    border: 1px solid rgba(226, 75, 74, 0.2);
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    margin: 0;
}

.btn-entrar {
    margin-top: 0.5rem;
    background: #185fa5;
    color: #e8f4ff;
    border: none;
    border-radius: 8px;
    padding: 0.8rem;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
}

.btn-entrar:hover:not(:disabled) {
    background: #1e6fc0;
}

.btn-entrar:active:not(:disabled) {
    transform: scale(0.98);
}

.btn-entrar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.register-link {
    text-align: center;
    font-size: 0.82rem;
    color: #3d6a8a;
    margin: 0;
}

.register-link a {
    color: #7eb8f7;
    text-decoration: none;
    font-weight: 500;
}

.register-link a:hover {
    text-decoration: underline;
}
</style>