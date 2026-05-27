<style scoped lang="scss" src="./NavMobileComponent.scss" />
<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../../middlewares/store';

defineProps(["loading"]);
const store: any = useStore();

const hasCharacter = computed(() => (store.currentUser.userData?.character ?? []).length > 0);
const activeChar = computed(() => {
  const chars = store.currentUser.userData?.character ?? [];
  return chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
});
const isWalker = computed(() => !activeChar.value?.clan);

const isLeaderOrOfficer = computed(() => {
  if (!activeChar.value?.clan) return false;
  const clan   = activeChar.value.clan;
  const charId = String(activeChar.value._id);
  return String(clan.leader) === charId ||
    (clan.officer ?? []).some((o: any) => String(o) === charId);
});

const requestsCount = computed(() => store.pendingRequestsCount);
</script>

<template>
  <div class="nav-container">
    <nav>
      <section class="router-section">

        <router-link title="Inicio" to="/" class="nav-item">
          <i class="fas fa-home"></i>
          <small>Inicio</small>
        </router-link>

        <template v-if="!isWalker">
          <router-link title="Guerra Sombría" to="/shadow-war" class="nav-item">
            <i class="fas fa-khanda"></i>
            <small>Guerra</small>
          </router-link>
          <router-link title="Torre Maldita" to="/accursed-tower" class="nav-item">
            <i class="fas fa-chess-rook"></i>
            <small>Torre</small>
          </router-link>
        </template>

        <router-link v-if="hasCharacter" title="Mis Tareas" to="/tasks" class="nav-item">
          <i class="fas fa-tasks"></i>
          <small>Tareas</small>
        </router-link>

        <router-link
          v-if="isLeaderOrOfficer"
          title="Gestión de Clan"
          to="/management"
          class="nav-item"
        >
          <span class="icon-wrap">
            <i class="fas fa-shield-halved"></i>
            <span v-if="requestsCount > 0" class="notif-badge">{{ requestsCount }}</span>
          </span>
          <small>Gestión</small>
        </router-link>

      </section>
    </nav>
  </div>
</template>
