<script setup lang="ts">
import SplashComponent from './app/components/SplashComponent.vue';
import ClanEventModal from './app/components/Walker/ClanEventModal.vue';
import { useStore } from './middlewares/store/index';
import { connectSocket } from './middlewares/socket';
import { useRouter } from 'vue-router';
import { Ref, ref, onMounted } from 'vue';

const store: any = useStore();
const router = useRouter();
const loading: Ref = ref(false);
const authDone: Ref = ref(false);

const WALKER_ALLOWED = ['/', '/tasks', '/tasks/my-tasks', '/tasks/clan-tasks', '/u/profile', '/u/account', '/requests'];

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
      store.handleFetchPendingInbox();
      store.handleFetchPendingRequests();
      store.handleGetNextShadowWar();
      const socket = connectSocket();
      socket.on('clan-request:new', () => {
        store.pendingRequestsCount += 1;
      });
      socket.on('clan-invitation:new', (data: any) => {
        store.addNotification({
          id: data.id,
          type: 'clan-invitation',
          targetType: 'character',
          targetId: data.character?._id ? String(data.character._id) : null,
          data,
        });
      });
      socket.on('clan-request:reviewed', (data: any) => {
        store.addNotification({
          id: `${data.id}:reviewed`,
          type: 'clan-request-reviewed',
          targetType: 'character',
          targetId: data.character?._id ? String(data.character._id) : null,
          data,
        });
        if (data.action === 'accept') {
          store.handleUserData().then(() => {
            store.clanEventModal = { type: 'accepted', clanName: data.clan?.name ?? '' };
          });
        }
      });
      socket.on('clan:member-removed', (data: any) => {
        store.handleUserData().then(() => {
          store.clanEventModal = { type: 'removed', clanName: data.clanName ?? '' };
        });
      });
      socket.on('clan:deleted', () => {
        store.handleUserData().then(() => {
          store.clanEventModal = { type: 'removed', clanName: '' };
        });
      });
      socket.on('clan-creation-request:reviewed', (data: any) => {
        if (data.action === 'accept') store.handleUserData();
      });
      socket.on('clan-claim-request:reviewed', (data: any) => {
        if (data.action === 'accept') store.handleUserData();
      });
      socket.on('character-request:reviewed', (data: any) => {
        store.addNotification({
          id: `${data.id}:char-reviewed`,
          type: 'character-request-reviewed',
          targetType: 'user',
          targetId: null,
          data,
        });
        if (data.action === 'accept') {
          store.handleUserData();
        }
      });
      socket.on('shadowwar:assigned', (data: any) => {
        store.addNotification({
          id: data.id,
          type: 'shadowwar-assignment',
          targetType: 'character',
          targetId: data.characterId ? String(data.characterId) : null,
          data,
        });
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
  <ClanEventModal
    v-if="store.clanEventModal"
    :type="store.clanEventModal.type"
    :clan-name="store.clanEventModal.clanName"
    @close="store.clanEventModal = null"
  />
</template>
