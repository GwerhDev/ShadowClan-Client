<style scoped lang="scss" src="./NavComponent.scss" />
<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useStore } from '../../middlewares/store';
import { useRouter } from 'vue-router';
import LogoComponent from './LogoComponent.vue';
defineProps(["loading"]);
const store: any = useStore();
const router = useRouter();

const role = computed(() => store.currentUser.userData?.role);
const isAdmin = computed(() => role.value === 'admin' || role.value === 'super_admin');
const hasCharacter = computed(() => (store.currentUser.userData?.character ?? []).length > 0);
const activeChar = computed(() => {
  const chars = store.currentUser.userData?.character ?? [];
  return chars.find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
});
const isWalker = computed(() => !isAdmin.value && !activeChar.value?.clan);

const isLeaderOrOfficer = computed(() => {
  if (!activeChar.value?.clan) return false;
  const clan = activeChar.value.clan;
  const charId = String(activeChar.value._id);
  return String(clan.leader) === charId ||
    (clan.officer ?? []).some((o: any) => String(o) === charId);
});

const notifications = computed(() => store.notifications);
const unreadCount = computed(() => notifications.value.filter((n: any) => !n.read).length);

const showDropdown = ref(false);
const bellWrapper = ref<HTMLElement | null>(null);

function onOutsideClick(e: MouseEvent) {
  if (!bellWrapper.value?.contains(e.target as Node)) {
    showDropdown.value = false;
  }
}

watch(showDropdown, (val) => {
  if (val) nextTick(() => document.addEventListener('click', onOutsideClick));
  else document.removeEventListener('click', onOutsideClick);
});

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) store.markNotificationsRead();
}

function closeDropdown() {
  showDropdown.value = false;
}

function goToRequests() {
  closeDropdown();
  router.push('/a/clan-requests');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}
</script>

<template>
  <div class="nav-container">
    <nav>
      <section class="logo-section">
        <LogoComponent />
      </section>

      <section class="router-section">
        <section class="user-section">
        </section>
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

        <router-link v-if="isAdmin" title="Dashboard" to="/a/dashboard" class="nav-item">
          <i class="fas fa-lock"></i>
          <small>Dashboard</small>
        </router-link>
      </section>

      <section class="user-section">

        <!-- Campana con dropdown -->
        <div class="bell-wrapper" ref="bellWrapper" v-if="store.currentUser.logged">
          <button class="bell-btn" @click="toggleDropdown" title="Notificaciones">
            <i class="fas fa-bell"></i>
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </button>


          <div v-if="showDropdown" class="notif-dropdown">
            <div class="notif-header">
              <span>Notificaciones</span>
              <button v-if="notifications.length" class="notif-clear" @click="store.clearNotifications()">
                Limpiar
              </button>
            </div>

            <div v-if="!notifications.length" class="notif-empty">
              Sin notificaciones
            </div>

            <ul v-else class="notif-list">
              <li v-for="n in notifications" :key="n.id" :class="{ unread: !n.read }">
                <i class="fas fa-flag-checkered"></i>
                <div class="notif-body">
                  <span><strong>{{ n.data.character?.name }}</strong> quiere unirse a <strong>{{ n.data.clan?.name
                      }}</strong></span>
                  <small>{{ formatDate(n.data.createdAt) }}</small>
                </div>
              </li>
            </ul>

            <button v-if="isLeaderOrOfficer" class="notif-go" @click="goToRequests">
              <i class="fas fa-list"></i> Ver solicitudes
            </button>
          </div>
        </div>

        <router-link to="/u/profile" title="Perfil">
          <i class="fas fa-user"></i>
        </router-link>
      </section>
    </nav>
  </div>
</template>
