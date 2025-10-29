<style scoped lang="scss" src="./AppLayout.scss" />
<script setup lang="ts">
import { useStore } from '../../middlewares/store';
import SideBar from './SideBar.vue';
import diabloIcon from "../../assets/svg/diablo-icon.svg";
import TabBar from './TabBar.vue';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import NavComponent from '../components/NavComponent.vue';

const store: any = useStore();
const route = useRoute();
const router = useRouter();

defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  tabs: Array as () => Array<{
    id: string;
    name: string;
    icon: string;
    length?: number;
    path: string;
  }>,
});

const handleDashboard = () => {
  router.push('/a/dashboard');
};

const dynamicTitle = computed(() => {
  if (route.meta.title) {
    return route.meta.title;
  }
  // Fallback to route name if meta.title is not defined
  return route.name ? String(route.name) : 'Dashboard';
});
</script>

<template>
  <div class="container-lo-page">
    <div class="lo-container">
      <div class="section-container">
        <section class="menu-section desktop" v-if="tabs">
          <img :src="diabloIcon" alt="icon" />
          <SideBar :logged="store.currentUser.logged" :tabs="tabs" />
        </section>

        <section class="content-section">
          <div class="header-section">
            <span class="title-section">
              <img :src="diabloIcon" alt="icon" />
              <h1>{{ dynamicTitle }}</h1>
            </span>
            <button @click="handleDashboard"
              v-if="store.currentUser.userData?.role === 'admin' || store.currentUser.userData?.role === 'clan-leader' || store.currentUser.userData?.role === 'officer'">Dashboard</button>
          </div>
          <section class="menu-section mobile" v-if="tabs">
            <TabBar :logged="store.currentUser.logged" :tabs="tabs" />
          </section>
          <div class="scrollable-content">
            <slot></slot>
          </div>
        </section>
      </div>
      <section>
        <NavComponent :loading="loading" />
      </section>
    </div>
  </div>
</template>
