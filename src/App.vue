<script setup lang="ts">
import { useStore } from './middlewares/store/index';
import { Ref, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const store: any = useStore();
const token: any = localStorage.getItem('userToken');
const loading: Ref = ref(false);
const router = useRouter();

onMounted(async () => {
  try {
    loading.value = true;
    await store.handleUserData(token);
    if (!store.currentUser.logged) {
      router.push('/signup');
    }
    loading.value = false;

  } catch (error) {
    loading.value = false;
    router.push('/signup');
  }
});

</script>

<template>
  <router-view />
</template>