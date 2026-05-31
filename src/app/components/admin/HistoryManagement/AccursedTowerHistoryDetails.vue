<template>
  <div class="history-details">

    <button class="btn-back" @click="router.push('/management/history')">
      <i class="fas fa-arrow-left"></i> Volver al historial
    </button>

    <template v-if="loading">
      <div class="detail-skeleton">
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-row">
          <div class="skeleton-box skeleton-chip"></div>
          <div class="skeleton-box skeleton-chip"></div>
        </div>
        <div class="skeleton-box skeleton-section"></div>
        <div class="skeleton-box skeleton-section"></div>
      </div>
    </template>

    <div v-else-if="error" class="detail-empty">
      <i class="fas fa-triangle-exclamation"></i>
      <p>Error al cargar los detalles.</p>
    </div>

    <div v-else-if="!tower" class="detail-empty">
      <i class="fas fa-chess-rook"></i>
      <p>No se encontraron detalles para esta Torre Maldita.</p>
    </div>

    <template v-else>

      <div class="detail-header">
        <div class="detail-meta">
          <span class="detail-vs">vs</span>
          <h2 class="detail-enemy">{{ tower.enemyClan?.name || 'Sin clan enemigo' }}</h2>
          <span class="detail-date">{{ formattedDate }}</span>
        </div>
        <div class="detail-actions">
          <template v-if="confirmDelete">
            <button class="ctx-confirm-btn" @click="deleteTower" :disabled="saving">
              <i class="fas fa-check"></i> Confirmar
            </button>
            <button class="ctx-cancel-btn" @click="confirmDelete = false">
              <i class="fas fa-times"></i>
            </button>
          </template>

          <template v-else-if="editing">
            <button class="ctx-confirm-btn" @click="saveEdit" :disabled="saving">
              <i class="fas fa-check"></i> Guardar
            </button>
            <button class="ctx-cancel-btn" @click="cancelEdit">
              <i class="fas fa-times"></i>
            </button>
          </template>

          <div v-else class="ctx-wrapper">
            <button class="btn-dots" @click.stop="toggleCtx">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <Teleport to="body">
              <template v-if="showCtx">
                <div class="ctx-overlay" @click="showCtx = false" />
                <div class="ctx-menu-fixed" :style="{ top: ctxPos.top + 'px', left: ctxPos.left + 'px', transform: 'translateX(-100%)' }">
                  <button class="ctx-item" @click="openEdit">
                    <i class="fas fa-pen"></i> Editar
                  </button>
                  <button class="ctx-item" @click="toggleCompleted" :disabled="saving">
                    <i :class="tower?.completed ? 'fas fa-rotate-left' : 'fas fa-flag-checkered'"></i>
                    {{ tower?.completed ? 'Marcar activa' : 'Completar' }}
                  </button>
                  <button class="ctx-item ctx-item--danger" @click="confirmDelete = true; showCtx = false">
                    <i class="fas fa-trash"></i> Eliminar
                  </button>
                </div>
              </template>
            </Teleport>
          </div>
        </div>
      </div>

      <!-- Edit mode fields -->
      <div v-if="editing" class="edit-fields-row">
        <div class="edit-field">
          <label>N° de Torre</label>
          <input type="number" v-model.number="editTowerNumber" min="1" class="tower-number-input" />
        </div>
        <div class="edit-field">
          <label>Fecha</label>
          <input type="date" v-model="editDate" />
        </div>
        <div class="edit-field edit-field--grow">
          <label>Clan Enemigo <span class="optional-tag">opcional</span></label>
          <SearchSelector
            v-model="editEnemyClan"
            :fetch-fn="searchClans"
            :selected-label="editEnemyClanName || tower.enemyClan?.name"
            placeholder="Buscar clan..."
            create-label="Crear clan enemigo"
            @create="showCreateClanModal = true"
            @clear="editEnemyClanName = ''"
          />
        </div>
      </div>

      <div class="detail-stats">
        <div class="stat-card">
          <span class="stat-label">Resultado</span>
          <select v-if="editing" class="result-select" v-model="selectedResult">
            <option v-for="opt in towerResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
          </select>
          <span v-else :class="['result-chip', `result-${selectedResult}`]">{{ resultLabel }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Torre N°</span>
          <span class="stat-value">{{ tower.towerNumber }}</span>
        </div>
      </div>

      <div v-if="tower.roster" class="tower-roster-grid">
        <div v-for="grp in (['group1', 'group2'] as const)" :key="grp" class="battle-section">
          <h5 class="battle-title">{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }}</h5>
          <div class="matches-list">
            <div
              v-for="(character, idx) in padGroup(tower.roster[grp], groupSizes[grp])"
              :key="idx"
              class="roster-slot"
              :class="{ 'roster-slot--empty': !character }"
            >
              <template v-if="character">
                <span class="roster-name">{{ character.name }}</span>
                <span class="roster-class">{{ character.currentClass || '—' }}</span>
              </template>
              <span v-else class="roster-empty-label">No asignado</span>
            </div>
          </div>
        </div>

        <div class="battle-section tower-group3">
          <h5 class="battle-title">Grupo 3</h5>
          <div class="matches-list">
            <div
              v-for="(character, idx) in padGroup(tower.roster.group3, groupSizes.group3)"
              :key="idx"
              class="roster-slot"
              :class="{ 'roster-slot--empty': !character }"
            >
              <template v-if="character">
                <span class="roster-name">{{ character.name }}</span>
                <span class="roster-class">{{ character.currentClass || '—' }}</span>
              </template>
              <span v-else class="roster-empty-label">No asignado</span>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>

  <Teleport to="body">
    <div v-if="showCreateClanModal" class="create-clan-overlay" @click.self="showCreateClanModal = false; createClanError = ''">
      <div class="create-clan-modal">
        <h4 class="create-clan-title">Crear clan enemigo</h4>
        <input class="create-clan-input" type="text" v-model="newClanName"
          placeholder="Nombre del clan" @keydown.enter="handleCreateClan" @keydown.esc="showCreateClanModal = false" />
        <p v-if="createClanError" class="create-clan-error">{{ createClanError }}</p>
        <div class="create-clan-actions">
          <button class="btn-create-clan" :disabled="!newClanName.trim() || creatingClan" @click="handleCreateClan">
            <i class="fas fa-check"></i> Crear
          </button>
          <button class="btn-cancel-modal" @click="showCreateClanModal = false; createClanError = ''">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../../../../middlewares/store';
import { updateAccursedTower, searchClans, createEnemyClan } from '../../../../middlewares/services';
import SearchSelector from '../../Selectors/SearchSelector.vue';

const route  = useRoute();
const router = useRouter();
const store: any = useStore();

const loading             = ref(true);
const error               = ref(false);
const saving              = ref(false);
const showCreateClanModal = ref(false);
const newClanName         = ref('');
const creatingClan        = ref(false);
const createClanError     = ref('');
const editEnemyClanName   = ref('');

async function handleCreateClan() {
  if (!newClanName.value.trim()) return;
  creatingClan.value    = true;
  createClanError.value = '';
  try {
    const name    = newClanName.value.trim();
    const created = await createEnemyClan(name);
    editEnemyClan.value       = created._id;
    editEnemyClanName.value   = name;
    showCreateClanModal.value = false;
    newClanName.value         = '';
  } catch (err: any) {
    createClanError.value = err?.response?.data?.message ?? 'Error al crear el clan.';
  } finally {
    creatingClan.value = false;
  }
}
const showCtx        = ref(false);
const ctxPos         = ref({ top: 0, left: 0 });
const confirmDelete  = ref(false);
const editing        = ref(false);
const selectedResult = ref('pending');
const editDate       = ref('');
const editEnemyClan  = ref('');
const editTowerNumber = ref<number | null>(null);

const tower = computed(() => store.admin.currentAccursedTower);

const towerResults = [
  { value: 'victory', text: 'Victoria'  },
  { value: 'defeat',  text: 'Derrota'   },
  { value: 'draw',    text: 'Empate'    },
  { value: 'pending', text: 'Pendiente' },
];

const resultLabel = computed(() => towerResults.find(r => r.value === selectedResult.value)?.text ?? '');
const groupSizes = { group1: 4, group2: 4, group3: 2 } as const;

function padGroup(arr: any[] | undefined, size: number): (any | undefined)[] {
  const result = [...(arr ?? [])];
  while (result.length < size) result.push(undefined);
  return result;
}

watch(tower, (val) => {
  if (val) selectedResult.value = val.result ?? 'pending';
}, { immediate: true });

const formattedDate = computed(() => {
  const d = tower.value?.date;
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
});

function toggleCtx(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  ctxPos.value = { top: rect.bottom + 4, left: rect.right };
  showCtx.value = !showCtx.value;
}

function openEdit() {
  const t = tower.value;
  editTowerNumber.value = t?.towerNumber ?? null;
  editDate.value = t?.date ? new Date(t.date).toISOString().slice(0, 10) : '';
  editEnemyClan.value = t?.enemyClan?._id ?? '';
  editing.value = true;
  showCtx.value = false;
}

function cancelEdit() {
  editing.value = false;
  confirmDelete.value = false;
}

async function saveEdit() {
  if (!tower.value?._id) return;
  saving.value = true;
  try {
    await updateAccursedTower(tower.value._id, {
      towerNumber: editTowerNumber.value ?? undefined,
      date:        editDate.value || undefined,
      enemyClan:   editEnemyClan.value || null,
      result:      selectedResult.value,
    });
    await store.handleGetAccursedTowerDetails(tower.value._id);
    editing.value = false;
  } finally {
    saving.value = false;
  }
}

async function toggleCompleted() {
  if (!tower.value?._id) return;
  saving.value = true;
  showCtx.value = false;
  try {
    const newCompleted = !tower.value.completed;
    await updateAccursedTower(tower.value._id, { completed: newCompleted });
    await store.handleGetAccursedTowerDetails(tower.value._id);
    if (newCompleted) router.push('/management/history');
  } finally {
    saving.value = false;
  }
}

async function deleteTower() {
  saving.value = true;
  try {
    await store.handleDeleteTowerWar(route.params.tower_id as string);
    router.push('/management/history');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    await store.handleGetAccursedTowerDetails(route.params.tower_id as string);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss" src="./HistoryDetails.scss"></style>

<style scoped lang="scss">
.tower-roster-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  .tower-group3 { grid-column: 1 / -1; }
}

.roster-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .55rem .75rem;
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 8px;
  background: rgba(255, 255, 255, .03);

  &--empty { justify-content: center; }
}

.roster-name  { font-size: .85rem; color: rgba(255, 255, 255, .8); }
.roster-class { font-size: .72rem; color: rgba(255, 255, 255, .35); }
.roster-empty-label { font-size: .78rem; color: rgba(255, 255, 255, .2); }

@media (max-width: 600px) {
  .tower-roster-grid { grid-template-columns: 1fr; }
  .tower-group3 { grid-column: 1; }
}
</style>
