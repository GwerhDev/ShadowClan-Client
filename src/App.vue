<script setup lang="ts">
import SplashComponent from './app/components/SplashComponent.vue';
import { useStore } from './middlewares/store/index';
import { Ref, ref, onMounted } from 'vue';

const store: any = useStore();
const loading: Ref = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    await store.handleUserData();
    loading.value = false;

  } catch (error) {
    loading.value = false;
  }
});

</script>

<template>
  <SplashComponent v-if="loading" />
  <router-view v-else />
</template>