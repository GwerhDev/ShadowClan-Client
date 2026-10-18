<script setup lang="ts">
import SplashComponent from './app/components/SplashComponent.vue';
import ClanEventModal from './app/components/Walker/ClanEventModal.vue';
import { useStore } from './middlewares/store/index';
import { connectSocket } from './middlewares/socket';
import { Ref, ref, onMounted } from 'vue';

const store = useStore();
const loading: Ref = ref(false);
const authDone: Ref = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    // Los permisos por ruta (walker / gestión de clan) los resuelve el guard del router.
    await store.ensureUserData();
    if (store.currentUser.logged) {
      store.handleFetchPendingInbox();
      store.handleFetchPendingRequests();
      store.handleGetNextShadowWar();
      store.handleGetActiveVigil();
      const socket = connectSocket();
      socket.on('clan-request:new', (data: any) => {
        // Only count if the notification targets the currently active character
        if (!data.targetCharacterId || data.targetCharacterId === store.currentCharacter) {
          store.pendingRequestsCount += 1;
        }
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
      socket.on('shadowwar:updated', () => {
        store.handleGetNextShadowWar();
        store.handleGetShadowWars?.();
      });
      // Vigilia de Espadas: la tab de miembros aparece/desaparece según haya una abierta.
      socket.on('vigil:assigned', (data: any) => {
        store.addNotification({
          id: data.id,
          type: 'vigil-assignment',
          targetType: 'character',
          targetId: data.characterId ? String(data.characterId) : null,
          data,
        });
      });
      socket.on('vigil:updated', () => {
        store.handleGetActiveVigil();
      });
      socket.on('tower:assigned', (data: any) => {
        store.addNotification({
          id: data.id,
          type: 'tower-assignment',
          targetType: 'character',
          targetId: data.characterId ? String(data.characterId) : null,
          data,
        });
      });
      socket.on('tower:updated', ({ towerId }: any) => {
        store.handleGetAccursedTowers?.(towerId);
        store.handleGetActiveTowerWar();
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
  <!-- router-view con clave = registro raíz: remonta la página al cambiar de sección (p. ej.
       /shadow-war → /vigil-of-blades, que comparten ShadowWarPage), pero no entre subrutas
       de una misma sección. -->
  <SplashComponent v-if="loading" :done="authDone" />
  <router-view v-else v-slot="{ Component, route }">
    <component :is="Component" :key="route.matched[0]?.path" />
  </router-view>
  <ClanEventModal
    v-if="store.clanEventModal"
    :type="store.clanEventModal.type"
    :clan-name="store.clanEventModal.clanName"
    @close="store.clanEventModal = null"
  />
</template>
