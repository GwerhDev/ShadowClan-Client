<script setup lang="ts">
import { ref, watch } from 'vue';
import TabModal from '../../Modals/TabModal.vue';
import SWFormationPreview from './SWFormationPreview.vue';
import { getHistory } from '../../../../middlewares/services';

const props = defineProps<{
  savedAlignments: { last: any | null; custom: { name: string; data: any }[] };
  clanMembers: any[];
  clanId: string;
  characterId: string;
}>();

const emit = defineEmits<{
  apply: [data: any];
  close: [];
}>();

const TABS = [
  { key: 'ultima',     label: 'Última',     icon: 'fas fa-clock-rotate-left' },
  { key: 'plantillas', label: 'Plantillas', icon: 'fas fa-bookmark' },
  { key: 'historial',  label: 'Historial',  icon: 'fas fa-scroll' },
];

// ── Plantillas state ─────────────────────────────────────────────────────────
const expandedTemplateIdx = ref<number | null>(null);

function toggleTemplate(i: number) {
  expandedTemplateIdx.value = expandedTemplateIdx.value === i ? null : i;
}

// ── Historial state ──────────────────────────────────────────────────────────
const history      = ref<any[]>([]);
const page         = ref(1);
const totalPages   = ref(1);
const loadingHist  = ref(false);
const search       = ref('');
const expandedId   = ref<string | null>(null);
const histLoaded   = ref(false);
const activeTab    = ref('ultima');

function pickBattle(entry: any) {
  const fb = entry.finalBattle;
  const hasContent = fb && Object.values(fb).some((arr: any) =>
    Array.isArray(arr) && arr.some((m: any) =>
      m?.group1?.character?.some(Boolean) || m?.group2?.character?.some(Boolean)
    )
  );
  return hasContent ? fb : entry.battle;
}

async function loadHistory(reset = false) {
  if (loadingHist.value) return;
  if (reset) { page.value = 1; history.value = []; }
  loadingHist.value = true;
  try {
    const res = await getHistory(page.value, 'shadow_war', props.characterId, search.value || undefined);
    history.value   = reset ? (res.data ?? []) : [...history.value, ...(res.data ?? [])];
    totalPages.value = res.pages ?? 1;
    histLoaded.value = true;
  } finally {
    loadingHist.value = false;
  }
}

function onTabChange(key: string) {
  activeTab.value = key;
  if (key === 'historial' && !histLoaded.value) loadHistory(true);
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadHistory(true), 500);
});

function nextPage() {
  if (page.value >= totalPages.value) return;
  page.value++;
  loadHistory();
}

function prevPage() {
  if (page.value <= 1) return;
  page.value--;
  loadHistory(true);
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });
}

function applyAndClose(data: any) {
  emit('apply', data);
  emit('close');
}
</script>

<template>
  <TabModal title="Formaciones" :tabs="TABS" @close="emit('close')" @tab-change="onTabChange">

    <!-- ── Última ─────────────────────────────────────────────────────────── -->
    <template #ultima>
      <div class="fm-tab">
        <div v-if="!savedAlignments.last" class="fm-empty">
          <i class="fas fa-clock-rotate-left"></i>
          <span>No hay formación guardada aún.</span>
        </div>
        <template v-else>
          <div class="fm-preview-wrap">
            <SWFormationPreview :battle="savedAlignments.last" :members="clanMembers" />
          </div>
          <button class="btn-apply" @click="applyAndClose(savedAlignments.last)">
            <i class="fas fa-check"></i> Aplicar
          </button>
        </template>
      </div>
    </template>

    <!-- ── Plantillas ─────────────────────────────────────────────────────── -->
    <template #plantillas>
      <div class="fm-tab">
        <div v-if="savedAlignments.custom.length === 0" class="fm-empty">
          <i class="fas fa-bookmark"></i>
          <span>No hay plantillas guardadas.</span>
        </div>
        <div v-else class="fm-hist-list">
          <div v-for="(slot, i) in savedAlignments.custom" :key="i" class="fm-hist-item">
            <button class="fm-hist-header" @click="toggleTemplate(i)">
              <div class="fm-hist-meta">
                <i class="fas fa-bookmark"></i>
                <span class="fm-hist-vs">{{ slot.name }}</span>
              </div>
              <i :class="expandedTemplateIdx === i ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </button>
            <div v-if="expandedTemplateIdx === i" class="fm-hist-body">
              <SWFormationPreview :battle="slot.data" :members="clanMembers" />
              <button class="btn-apply" @click="applyAndClose(slot.data)">
                <i class="fas fa-check"></i> Aplicar
              </button>
            </div>
          </div>
        </div><!-- /fm-hist-list -->
      </div>
    </template>

    <!-- ── Historial ──────────────────────────────────────────────────────── -->
    <template #historial>
      <div class="fm-tab fm-tab--hist">
        <div class="fm-search">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="search" placeholder="Buscar por clan..." />
        </div>

        <div class="fm-hist-list">
          <div v-if="loadingHist && history.length === 0" class="fm-loading">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="history.length === 0" class="fm-empty">
            <i class="fas fa-scroll"></i>
            <span>Sin registros de guerras pasadas.</span>
          </div>
          <template v-else>
            <div
              v-for="entry in history"
              :key="entry._id"
              class="fm-hist-item"
            >
              <button
                class="fm-hist-header"
                @click="toggleExpand(entry._id)"
              >
                <div class="fm-hist-meta">
                  <i class="fas fa-swords"></i>
                  <span class="fm-hist-date">{{ formatDate(entry.date) }}</span>
                  <span v-if="entry.enemyClan?.name" class="fm-hist-vs">vs {{ entry.enemyClan.name }}</span>
                </div>
                <div class="fm-hist-right">
                  <span v-if="entry.result" :class="['fm-hist-result', `fm-hist-result--${entry.result}`]">
                    {{ entry.result }}
                  </span>
                  <i :class="expandedId === entry._id ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                </div>
              </button>
              <div v-if="expandedId === entry._id" class="fm-hist-body">
                <SWFormationPreview :battle="pickBattle(entry)" :members="clanMembers" />
                <button class="btn-apply" @click="applyAndClose(pickBattle(entry))">
                  <i class="fas fa-check"></i> Aplicar
                </button>
              </div>
            </div>
          </template>
        </div>

        <div v-if="totalPages > 1" class="fm-pagination">
          <button class="btn-page" :disabled="page <= 1 || loadingHist" @click="prevPage">
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          <span class="fm-page-info">{{ page }} / {{ totalPages }}</span>
          <button class="btn-page" :disabled="page >= totalPages || loadingHist" @click="nextPage">
            Siguiente <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </template>

  </TabModal>
</template>

<style scoped lang="scss">
.fm-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: .75rem;
  overflow: hidden;

  &--hist {
    gap: .5rem;
  }
}

.fm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  color: rgba(255, 255, 255, .25);

  i { font-size: 1.4rem; }
  span { font-size: .8rem; }
}

.fm-preview-wrap {
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }
}

.btn-apply {
  width: 100%;
  padding: .6rem;
  background: rgba(227, 210, 168, .1);
  border: 1px solid rgba(227, 210, 168, .3);
  border-radius: 6px;
  color: rgb(227, 210, 168);
  font-size: .8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  flex-shrink: 0;
  transition: background .15s, border-color .15s;

  &:hover {
    background: rgba(227, 210, 168, .18);
    border-color: rgba(227, 210, 168, .5);
  }
}

// ── Plantillas / Historial (shared accordion styles) ─────────────────────────
.fm-search {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: rgba(0,0,0,.2);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 6px;
  padding: .45rem .65rem;
  flex-shrink: 0;

  i { color: rgba(255,255,255,.3); font-size: .8rem; }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: rgba(255,255,255,.8);
    font-size: .8rem;

    &::placeholder { color: rgba(255,255,255,.25); }
  }
}

.fm-hist-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  min-height: 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }
}

.fm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: rgba(255,255,255,.3);
  font-size: 1.2rem;
}

.fm-hist-item {
  flex-shrink: 0;
  background: rgba(0,0,0,.15);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 7px;
  overflow: hidden;
}

.fm-hist-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .6rem .75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,.75);
  text-align: left;
  transition: background .12s;

  &:hover { background: rgba(255,255,255,.04); }
}

.fm-hist-meta {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex: 1;
  min-width: 0;

  i { color: rgba(255,255,255,.3); font-size: .75rem; flex-shrink: 0; }
}

.fm-hist-date {
  font-size: .72rem;
  color: rgba(255,255,255,.5);
  flex-shrink: 0;
}

.fm-hist-vs {
  font-size: .75rem;
  color: rgba(255,255,255,.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-hist-right {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-shrink: 0;

  i { font-size: .7rem; color: rgba(255,255,255,.3); }
}

.fm-hist-result {
  font-size: .65rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  border-radius: 3px;
  padding: .15rem .4rem;
  border: 1px solid transparent;

  &--win,
  &--victory  { background: rgba(76,175,80,.12);  border-color: rgba(76,175,80,.3);  color: #81c784; }
  &--loss,
  &--defeat   { background: rgba(244,67,54,.12);  border-color: rgba(244,67,54,.3);  color: #e57373; }
  &--draw,
  &--tie      { background: rgba(255,193,7,.12);  border-color: rgba(255,193,7,.3);  color: #ffd54f; }
}

.fm-hist-body {
  padding: .6rem .75rem .75rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
  border-top: 1px solid rgba(255,255,255,.06);
}

// ── Paginación ───────────────────────────────────────────────────────────────
.fm-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  flex-shrink: 0;
  padding-top: .25rem;
}

.btn-page {
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .4rem .75rem;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 5px;
  color: rgba(255,255,255,.6);
  font-size: .75rem;
  cursor: pointer;
  transition: background .12s, color .12s;

  &:hover:not(:disabled) {
    background: rgba(255,255,255,.1);
    color: rgba(255,255,255,.9);
  }

  &:disabled { opacity: .35; cursor: default; }
}

.fm-page-info {
  font-size: .75rem;
  color: rgba(255,255,255,.4);
  min-width: 3rem;
  text-align: center;
}
</style>
