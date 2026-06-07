import { defineStore } from "pinia";
import { ref } from "vue";
import { auth } from "../firebase/config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";

export const useAuthStore = defineStore("auth", () => {
    const user = ref(null);
    const error = ref(null);
    const loading = ref(false);

    // Observa mudanças de autenticação (mantém o usuário logado ao recarregar)
    const initAuth = () => {
        onAuthStateChanged(auth, (currentUser) => {
            user.value = currentUser;
        });
    };

    // Cadastro
    const register = async (email, password) => {
        error.value = null;
        loading.value = true;
        try {
            const credentials = await createUserWithEmailAndPassword(auth, email, password);
            user.value = credentials.user;
        } catch (err) {
            error.value = tratarErro(err.code);
        } finally {
            loading.value = false;
        }
    };

    // Login
    const login = async (email, password) => {
        error.value = null;
        loading.value = true;
        try {
            const credentials = await signInWithEmailAndPassword(auth, email, password);
            user.value = credentials.user;
        } catch (err) {
            error.value = tratarErro(err.code);
        } finally {
            loading.value = false;
        }
    };

    // Logout
    const logout = async () => {
        await signOut(auth);
        user.value = null;
    };

    // Traduz os erros do Firebase para português
    const tratarErro = (code) => {
        const erros = {
            "auth/email-already-in-use": "Este e-mail já está em uso.",
            "auth/invalid-email": "E-mail inválido.",
            "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
            "auth/user-not-found": "Usuário não encontrado.",
            "auth/wrong-password": "Senha incorreta.",
            "auth/invalid-credential": "E-mail ou senha incorretos.",
        };
        return erros[code] || "Ocorreu um erro. Tente novamente.";
    };

    return { user, error, loading, initAuth, register, login, logout };
});