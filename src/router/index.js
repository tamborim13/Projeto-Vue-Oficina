import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStores";
import MainLayout from "../layouts/MainLayout.vue";

const routes = [
    { path: "/", redirect: "/login" },
    {
        path: "/login",
        name: "Login",
        component: () => import("../views/loginView.vue"),
        meta: { requiresGuest: true },
    },
    {
        path: "/register",
        name: "Register",
        component: () => import("../views/registerView.vue"),
        meta: { requiresGuest: true },
    },
    {
        path: "/",
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: "home",
                name: "Home",
                component: () => import("../views/homeView.vue"),
            },
            {
                path: "orcamento",
                name: "Orcamento",
                component: () => import("../views/orcamentoView.vue"),
            },
            {
                path: "agendamentos",
                name: "Agendamentos",
                component: () => import("../views/agendamentosView.vue"),
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const authStore = useAuthStore();
    if (to.meta.requiresGuest && authStore.user) return "/home";
    if (to.meta.requiresAuth && !authStore.user) return "/login";
});

export default router;