<script setup lang="ts">
import SplashComponent from './app/components/SplashComponent.vue';
import { useStore } from './middlewares/store/index';
import { Ref, ref, onMounted } from 'vue';

const store: any = useStore();
const loading: Ref = ref(false);
const authDone: Ref = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    await store.handleUserData();
  } finally {
    authDone.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    loading.value = false;
  }
});
</script>

<template>
  <SplashComponent v-if="loading" :done="authDone" />
  <router-view v-else />
</template>
