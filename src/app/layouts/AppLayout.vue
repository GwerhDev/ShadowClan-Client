<style scoped lang="scss" src="./AppLayout.scss" />
<script setup lang="ts">
import { useStore } from '../../middlewares/store';
import SideBar from './SideBar.vue';
import diabloIcon from "../../assets/svg/diablo-icon.svg";
import TabBar from './TabBar.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const store: any = useStore();
const route = useRoute();

defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  sidebarTabs: Array as () => Array<{
    id: string;
    name: string;
    icon: string;
    length?: number;
    path: string;
  }>,
});

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
        <section class="menu-section desktop">
          <img :src="diabloIcon" alt="icon" />
          <SideBar :logged="store.currentUser.logged" :tabs="sidebarTabs" />
        </section>

        <section class="content-section">
          <span class="title-section">
            <img :src="diabloIcon" alt="icon" />
            <h1>{{ dynamicTitle }}</h1>
          </span>
          <section class="menu-section mobile">
            <TabBar :logged="store.currentUser.logged" :tabs="sidebarTabs" />
          </section>
          <div class="scrollable-content">
            <slot></slot>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
