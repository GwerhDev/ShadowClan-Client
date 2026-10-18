<style scoped lang="scss" src="./AppLayout.scss" />
<script setup lang="ts">
import { useStore } from '../../middlewares/store';
import SideBar from './SideBar.vue';
import diabloIcon from "../../assets/png/shadowclan-icon.png";
import TabBar from './TabBar.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import NavComponent from '../components/NavComponent.vue';
import NavMobileComponent from '../components/NavMobileComponent.vue';

const store = useStore();
const route = useRoute();

const props = defineProps({
  loading: {
    type: Boolean,
    required: false
  },
  hideTitle: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: false
  },
  tabs: Array as () => Array<{
    id: string;
    name: string;
    icon: string;
    length?: number;
    path: string;
    badge?: number;
  }>,
});

const dynamicTitle = computed(() => {
  if (props.title) return props.title;
  if (route.meta.title) {
    return route.meta.title;
  }
});
</script>

<template>
  <div class="container-lo-page">
    <div class="lo-container">
      <section>
        <NavComponent :loading="loading" />
      </section>
      <div class="section-container">
        <section class="menu-section desktop" v-if="tabs && tabs.length">
          <div class="sidebar-icon-wrap">
            <img :src="diabloIcon" alt="icon" />
          </div>
          <SideBar :logged="store.currentUser.logged" :tabs="tabs" />
        </section>

        <section class="content-section">
          <section class="menu-section mobile" v-if="tabs && tabs.length">
            <TabBar :logged="store.currentUser.logged" :tabs="tabs" />
          </section>
          <div class="scrollable-content">
            <div class="header-section" v-if="!hideTitle">
              <span class="title-section">
                <img :src="diabloIcon" alt="icon" />
                <h1>{{ dynamicTitle }}</h1>
              </span>
            </div>
            <slot></slot>
          </div>
        </section>
      </div>
    </div>
    <!-- Fuera de .lo-container: su backdrop-filter convertiría el position:fixed en relativo a él. -->
    <NavMobileComponent :loading="loading" />
  </div>
</template>
