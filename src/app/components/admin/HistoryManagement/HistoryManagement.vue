<style scoped lang="scss" src="./HistoryManagement.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import TableComponent from '../../Tables/TableComponent.vue';
import HistoryListCard from './HistoryListCard.vue';

type HistoryFilter = 'all' | 'shadow_war' | 'accursed_tower';

const currentPage = ref(1);
const hasMore     = ref(true);
const isFetching  = ref(false);
const filter      = ref<HistoryFilter>('all');
const sentinel    = ref<HTMLElement | null>(null);

const store: any = useStore();
const loading    = ref(true);
const route      = useRoute();

let scrollObserver: IntersectionObserver | null = null;

const loadMore = async () => {
  if (isFetching.value || !hasMore.value) return;
  isFetching.value = true;
  currentPage.value++;
  const fetchedMore = await store.handleGetHistory(currentPage.value, filter.value, true);
  hasMore.value    = fetchedMore;
  isFetching.value = false;
};

const fetchHistory = async () => {
  loading.value     = true;
  currentPage.value = 1;
  hasMore.value     = true;
  isFetching.value  = false;
  const fetchedInitial = await store.handleGetHistory(1, filter.value, false);
  hasMore.value        = fetchedInitial;
  loading.value        = false;
};

function setupObserver() {
  scrollObserver?.disconnect();
  if (!sentinel.value) return;
  scrollObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) loadMore();
  }, { threshold: 0 });
  scrollObserver.observe(sentinel.value);
}

onMounted(() => setupObserver());
onUnmounted(() => scrollObserver?.disconnect());

watch(sentinel, el => {
  if (el) setupObserver();
});

watch(() => store.currentUser.logged, async (isLoggedIn) => {
  if (isLoggedIn) {
    await fetchHistory();
    setupObserver();
  } else {
    store.admin.history = [];
    loading.value = false;
  }
}, { immediate: true });

watch(() => route.name, (newName) => {
  if (newName === 'ManagementHistory') fetchHistory();
});

// Reload when the active character changes (user may switch to a different clan)
watch(() => store.currentCharacter, (newId, oldId) => {
  if (newId && newId !== oldId) fetchHistory();
});

const navItems = ['tipo', 'fecha', 'enemigo', 'resultado', 'acciones'];
</script>

<template>
  <div class="ul-container">
    <router-view v-if="route.params.shadowwar_id || route.params.tower_id" />
    <template v-else>

      <div v-if="loading" class="skeleton-table-container">
        <div class="skeleton-table-header skeleton-cols-5">
          <div class="skeleton-box skeleton-header-item" v-for="n in 5" :key="n"></div>
        </div>
        <div class="skeleton-table-row skeleton-cols-5" v-for="n in 5" :key="n">
          <div class="skeleton-box skeleton-cell" v-for="c in 5" :key="c"></div>
        </div>
      </div>

      <template v-else>
        <TableComponent :navItems="navItems">
          <template #header>
            <li class="th-cell">
              <select v-model="filter" @change="fetchHistory" class="type-filter-select" :class="{ active: filter !== 'all' }">
                <option value="all">Todas</option>
                <option value="shadow_war">Guerras Sombrías</option>
                <option value="accursed_tower">Torres Malditas</option>
              </select>
            </li>
            <li class="th-cell">fecha</li>
            <li class="th-cell">enemigo</li>
            <li class="th-cell">resultado</li>
            <li class="th-cell th-cell--last">acciones</li>
          </template>

          <HistoryListCard
            v-for="item in store.admin.history"
            :key="item._id"
            :war="item"
          />

          <li v-if="!store.admin.history?.length" class="table-empty-row">
            <i class="fas fa-clock-rotate-left"></i>
            <span>No hay historiales disponibles.</span>
          </li>

          <div v-if="isFetching" class="skeleton-table-row skeleton-cols-5">
            <div class="skeleton-box skeleton-cell" v-for="c in 5" :key="c"></div>
          </div>
        </TableComponent>
      </template>

      <div ref="sentinel" class="sentinel"></div>

    </template>
  </div>
</template>

<style scoped lang="scss">
.sentinel { height: 1px; }
</style>
