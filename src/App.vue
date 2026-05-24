<script setup lang="ts">
import SplashComponent from './app/components/SplashComponent.vue';
import { useStore } from './middlewares/store/index';
import { connectSocket } from './middlewares/socket';
import { useRouter } from 'vue-router';
import { Ref, ref, onMounted } from 'vue';

const store: any = useStore();
const router = useRouter();
const loading: Ref = ref(false);
const authDone: Ref = ref(false);

const WALKER_ALLOWED = ['/', '/tasks', '/tasks/my-tasks', '/tasks/clan-tasks', '/u/profile', '/u/account'];

onMounted(async () => {
  loading.value = true;
  try {
    await store.handleUserData();
    const role    = store.currentUser.userData?.role;
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      const chars  = store.currentUser.userData?.character ?? [];
      const active = (chars as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
      const isWalker = !active?.clan;
      if (isWalker) {
        const path = router.currentRoute.value.path;
        if (!WALKER_ALLOWED.some(p => path === p || path.startsWith('/tasks'))) {
          router.replace('/');
        }
      }
    }
    if (store.currentUser.logged) {
      const socket = connectSocket();
      socket.on('clan-request:new', (data: any) => {
        store.addNotification({ id: data.id, type: 'clan-request', data });
      });
    }
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
