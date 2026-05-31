<style scoped lang="scss" src="./HistoryManagement.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import TableComponent from '../../Tables/TableComponent.vue';
import HistoryListCard from './HistoryListCard.vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { createHistoryEntry } from '../../../../middlewares/services/historyService';
import { searchEnemyClans } from '../../../../middlewares/services/towerWarService';
import SearchSelector from '../../Selectors/SearchSelector.vue';

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

// ── Add history modal ──
const showAddModal = ref(false);
const addLoading   = ref(false);
const addError     = ref('');
const addForm      = ref({
  type:          'shadow_war' as 'shadow_war' | 'accursed_tower',
  date:          new Date().toISOString().slice(0, 10),
  enemyClanName: '',
  result:        'victory',
  towerNumber:   1,
});

const active = computed(() => {
  const chars = store.currentUser.userData?.character ?? [];
  return (chars as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
});

const isLeaderOrOfficer = computed(() => {
  const clan = active.value?.clan;
  if (!clan) return false;
  const charId = String(active.value._id);
  if (String(clan.leader?._id ?? clan.leader ?? '') === charId) return true;
  return (clan.officer ?? []).some((o: any) => String(o._id ?? o) === charId);
});

// Clan selector state
const selectedClanId  = ref('');
const showCreateClan  = ref(false);
const newClanName     = ref('');

function onClanSelect(clan: any) {
  addForm.value.enemyClanName = clan.name;
}
function onClanClear() {
  addForm.value.enemyClanName = '';
  selectedClanId.value = '';
}
function onClanCreate() {
  showCreateClan.value = true;
  newClanName.value    = '';
}
function confirmNewClan() {
  const name = newClanName.value.trim();
  if (!name) return;
  addForm.value.enemyClanName = name;
  selectedClanId.value        = name; // non-empty so SearchSelector shows as "selected"
  showCreateClan.value        = false;
}

function openAddModal() {
  addForm.value = {
    type: 'shadow_war',
    date: new Date().toISOString().slice(0, 10),
    enemyClanName: '',
    result: 'victory',
    towerNumber: 1,
  };
  selectedClanId.value  = '';
  showCreateClan.value  = false;
  newClanName.value     = '';
  addError.value        = '';
  showAddModal.value    = true;
}

async function handleAddHistory() {
  if (!active.value) return;
  addLoading.value = true;
  addError.value   = '';
  try {
    await createHistoryEntry({
      characterId:   active.value._id,
      type:          addForm.value.type,
      date:          addForm.value.date,
      enemyClanName: addForm.value.enemyClanName.trim() || undefined,
      result:        addForm.value.result,
      towerNumber:   addForm.value.type === 'accursed_tower' ? addForm.value.towerNumber : undefined,
    });
    showAddModal.value = false;
    await fetchHistory();
  } catch (e: any) {
    addError.value = e?.response?.data?.message ?? 'Error al guardar.';
  } finally {
    addLoading.value = false;
  }
}
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
        <button v-if="isLeaderOrOfficer" class="btn-add-history" @click="openAddModal">
          <i class="fas fa-plus"></i> Agregar instancia
        </button>
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

      <!-- Add history modal -->
      <CustomModal v-if="showAddModal" title="Agregar al historial" @close="showAddModal = false">
        <div class="add-modal">
          <div class="field-group">
            <label class="field-label">Tipo</label>
            <select v-model="addForm.type" class="field-select">
              <option value="shadow_war">Guerra Sombría</option>
              <option value="accursed_tower">Torre Maldita</option>
            </select>
          </div>

          <div class="field-group">
            <label class="field-label">Fecha</label>
            <input type="date" v-model="addForm.date" class="field-input" />
          </div>

          <div class="field-group" v-if="addForm.type === 'accursed_tower'">
            <label class="field-label">Número de torre</label>
            <input type="number" v-model.number="addForm.towerNumber" class="field-input" min="1" max="99" />
          </div>

          <div class="field-group">
            <label class="field-label">Clan enemigo</label>
            <SearchSelector
              v-model="selectedClanId"
              :fetch-fn="searchEnemyClans"
              placeholder="Buscar clan enemigo..."
              create-label="Crear clan enemigo"
              :selected-label="addForm.enemyClanName"
              @select="onClanSelect"
              @clear="onClanClear"
              @create="onClanCreate"
            />
            <!-- Inline create form -->
            <div v-if="showCreateClan" class="create-clan-inline">
              <input
                v-model="newClanName"
                class="field-input"
                placeholder="Nombre del nuevo clan"
                @keyup.enter="confirmNewClan"
              />
              <button class="btn-confirm-clan" @click="confirmNewClan" :disabled="!newClanName.trim()">
                <i class="fas fa-check"></i>
              </button>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Resultado</label>
            <select v-model="addForm.result" class="field-select">
              <option value="victory">Victoria</option>
              <option value="defeat">Derrota</option>
              <option value="draw">Empate</option>
            </select>
          </div>

          <p v-if="addError" class="add-error">{{ addError }}</p>

          <button class="btn-submit" :disabled="addLoading" @click="handleAddHistory">
            <i class="fas fa-check"></i>
            {{ addLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </CustomModal>

    </template>
  </div>
</template>

<style scoped lang="scss">
.sentinel { height: 1px; }

.btn-add-history {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  height: 30px;
  padding: 0 1rem;
  background: transparent;
  border: 1px solid rgba(227, 210, 168, .3);
  border-radius: 6px;
  color: rgba(227, 210, 168, .8);
  font-size: .8rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background .15s, border-color .15s, color .15s;

  &:hover {
    background: rgba(227, 210, 168, .07);
    border-color: rgba(227, 210, 168, .55);
    color: rgb(227, 210, 168);
  }
}

.add-modal {
  display: flex;
  flex-direction: column;
  gap: .85rem;
  min-width: 280px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.field-label {
  font-size: .72rem;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .45);
}

.field-input,
.field-select {
  height: 32px;
  padding: 0 .65rem;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 6px;
  color: rgba(255, 255, 255, .85);
  font-size: .85rem;
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &:focus { border-color: rgba(227, 210, 168, .4); }
  option  { background: #1c1e26; }
}

.create-clan-inline {
  display: flex;
  gap: .4rem;
  margin-top: .25rem;
}

.btn-confirm-clan {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(74, 222, 128, .3);
  border-radius: 6px;
  color: #4ade80;
  cursor: pointer;
  transition: background .15s;

  &:hover:not(:disabled) { background: rgba(74, 222, 128, .08); }
  &:disabled { opacity: .4; cursor: not-allowed; }
}

.add-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  width: 100%;
  height: 32px;
  background: transparent;
  border: 1px solid rgba(227, 210, 168, .3);
  border-radius: 6px;
  color: rgba(227, 210, 168, .85);
  font-size: .84rem;
  cursor: pointer;
  transition: background .15s, border-color .15s;

  &:hover:not(:disabled) { background: rgba(227, 210, 168, .08); border-color: rgba(227, 210, 168, .55); }
  &:disabled { opacity: .45; cursor: not-allowed; }
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 360px;
  display: flex;
  align-items: center;

  @media (max-width: 600px) {
    max-width: none;
  }
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
