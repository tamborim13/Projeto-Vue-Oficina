<script setup>
  import { onMounted } from "vue";
  import { useAuthStore } from "./stores/authStores";

  const authStore = useAuthStore();
  onMounted(() => authStore.initAuth());
</script>

<template>
  <RouterView />
</template>