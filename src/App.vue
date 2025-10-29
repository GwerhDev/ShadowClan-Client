<script setup lang="ts">
import { useStore } from './middlewares/store/index';
import { Ref, ref, onMounted } from 'vue';

const store: any = useStore();
const token: any = localStorage.getItem('userToken');
const loading: Ref = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    await store.handleUserData(token);
    loading.value = false;

  } catch (error) {
    loading.value = false;
  }
});

</script>

<template>
  <router-view />
</template>