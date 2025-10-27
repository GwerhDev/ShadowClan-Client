<style scoped lang="scss" src="./HistoryManagement.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import TableComponent from '../../Tables/TableComponent.vue';
import HistoryListCard from './HistoryListCard.vue';

const currentPage = ref(1);
const hasMore = ref(true);
const isFetching = ref(false);

const store: any = useStore();
const loading = ref(true);
const route = useRoute();

const loadMore = async () => {
  isFetching.value = true;
  currentPage.value++;
  const fetchedMore = await store.handleGetShadowWars(currentPage.value, true);
  hasMore.value = fetchedMore;
  isFetching.value = false;
};

const fetchShadowWars = async () => {
  loading.value = true;
  currentPage.value = 1;
  hasMore.value = true;
  isFetching.value = false;
  const fetchedInitial = await store.handleGetShadowWars(currentPage.value, false);
  hasMore.value = fetchedInitial;
  loading.value = false;
};

watch(() => store.currentUser.logged, async (isLoggedIn) => {
  if (isLoggedIn) {
    fetchShadowWars();
  } else {
    store.admin.shadowWars = null;
    loading.value = false;
  }
}, { immediate: true });

watch(() => route.name, (newName) => {
  if (newName === 'DashboardHistory') {
    fetchShadowWars();
  }
});

const navItems = ['fecha', 'enemigo', 'resultado', 'acciones'];

</script>

<template>
  <div class="ul-container">
    <router-view v-if="route.params.shadowwar_id" />
    <template v-else>
      <ul v-if="!loading && store.admin.shadowWars">
        <TableComponent :navItems="navItems">
          <li v-for="war in store.admin.shadowWars" :key="war._id">
            <HistoryListCard :war="war"></HistoryListCard>
          </li>
          <li v-if="isFetching && hasMore" class="loading-indicator">
            Cargando más historiales...
          </li>
        </TableComponent>
      </ul>
      <div v-if="hasMore && !loading && !isFetching" class="load-more-container">
        <button @click="loadMore" :disabled="isFetching">Cargar más</button>
      </div>
      <div v-else-if="loading" class="skeleton-table-container">
        <div class="skeleton-table-header">
          <div class="skeleton-box skeleton-header-item"></div>
          <div class="skeleton-box skeleton-header-item"></div>
          <div class="skeleton-box skeleton-header-item"></div>
          <div class="skeleton-box skeleton-header-item"></div>
        </div>
        <div class="skeleton-table-row" v-for="n in 5" :key="n">
          <div class="skeleton-box skeleton-cell"></div>
          <div class="skeleton-box skeleton-cell"></div>
          <div class="skeleton-box skeleton-cell"></div>
          <div class="skeleton-box skeleton-cell"></div>
        </div>
      </div>
      <p v-else>No hay historiales disponibles.</p>
    </template>
  </div>
</template>