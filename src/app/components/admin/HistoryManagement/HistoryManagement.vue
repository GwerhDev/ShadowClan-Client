<style scoped lang="scss" src="./HistoryManagement.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import TableComponent from '../../Tables/TableComponent.vue';
import HistoryListCard from './HistoryListCard.vue';

type HistoryFilter = 'all' | 'shadow_war' | 'accursed_tower';

const currentPage   = ref(1);
const hasMore       = ref(true);
const isFetching    = ref(false);
const filter        = ref<HistoryFilter>('all');
const searchQuery   = ref('');
const sentinel      = ref<HTMLElement | null>(null);
let   searchDebounce: ReturnType<typeof setTimeout> | null = null;

const store: any = useStore();
const loading    = ref(true);
const route      = useRoute();

let scrollObserver: IntersectionObserver | null = null;

const loadMore = async () => {
  if (isFetching.value || !hasMore.value) return;
  isFetching.value = true;
  currentPage.value++;
  const fetchedMore = await store.handleGetHistory(currentPage.value, filter.value, true, searchQuery.value || undefined);
  hasMore.value    = fetchedMore;
  isFetching.value = false;
};

const fetchHistory = async () => {
  loading.value     = true;
  currentPage.value = 1;
  hasMore.value     = true;
  isFetching.value  = false;
  const fetchedInitial = await store.handleGetHistory(1, filter.value, false, searchQuery.value || undefined);
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

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(fetchHistory, 500);
});

const navItems = ['tipo', 'fecha', 'enemigo', 'resultado', 'acciones'];
</script>

<template>
  <div class="ul-container">
    <router-view v-if="route.params.shadowwar_id || route.params.tower_id" />
    <template v-else>

      <!-- Toolbar + table: always visible once mounted -->
      <div class="history-toolbar">
        <div class="search-wrap">
          <i class="fas fa-magnifying-glass search-icon"></i>
          <input v-model="searchQuery" class="search-input" placeholder="Buscar por clan enemigo..." />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      </div>

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

        <!-- Skeleton rows during initial load or search fetch -->
        <template v-if="loading || isFetching">
          <div class="skeleton-table-row skeleton-cols-5" v-for="n in 6" :key="'sk' + n">
            <div class="skeleton-box skeleton-cell" v-for="c in 5" :key="c"></div>
          </div>
        </template>

        <template v-else>
          <HistoryListCard
            v-for="item in store.admin.history"
            :key="item._id"
            :war="item"
          />
          <li v-if="!store.admin.history?.length" class="table-empty-row">
            <i class="fas fa-clock-rotate-left"></i>
            <span>{{ searchQuery ? `Sin resultados para "${searchQuery}".` : 'No hay historiales disponibles.' }}</span>
          </li>
        </template>
      </TableComponent>

      <div ref="sentinel" class="sentinel"></div>

    </template>
  </div>
</template>

<style scoped lang="scss">
.sentinel { height: 1px; }

.history-toolbar {
  display: flex;
  align-items: center;
  padding: .25rem 0 .75rem;
}

.search-wrap {
  position: relative;
  width: 280px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: .65rem;
  font-size: .75rem;
  color: rgba(255, 255, 255, .3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 30px;
  padding: 0 2rem 0 2rem;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 6px;
  color: rgba(255, 255, 255, .85);
  font-size: .82rem;
  box-sizing: border-box;

  &:focus { outline: none; border-color: rgba(227, 210, 168, .35); }
  &::placeholder { color: rgba(255, 255, 255, .25); }
}

.search-clear {
  position: absolute;
  right: .5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, .35);
  cursor: pointer;
  font-size: .75rem;
  display: flex;
  align-items: center;
  padding: 0;
  &:hover { color: rgba(255, 255, 255, .7); }
}
</style>
