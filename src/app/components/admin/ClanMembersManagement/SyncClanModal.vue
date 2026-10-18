<script setup lang="ts">
import { ref, computed } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { previewClanSync, syncClanMembers } from '../../../../middlewares/services';
import { classes } from '../../../../middlewares/misc/const';
import type { ClanSyncPreview, ClanSyncResolution, FileImportResult, SyncCandidate } from '../../../../interfaces';

/**
 * Modal: sincroniza los miembros del clan desde un archivo .csv / .xlsx en tres pasos:
 *  1. elegir archivo → 2. revisar (vista previa, sin escribir) y decidir qué hacer con cada
 *  personaje nuevo: crearlo o reemplazar a uno existente (que toma el nombre y atributos
 *  nuevos y conserva su historial) → 3. resultado.
 */
const props = defineProps<{
  clanId: string;
  /** Recarga el clan en el componente padre. */
  reload: () => Promise<void>;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

type Step = 'select' | 'review' | 'done';
const step     = ref<Step>('select');
const file     = ref<File | null>(null);
const loading  = ref(false);
const error    = ref('');
const preview  = ref<ClanSyncPreview | null>(null);
const result   = ref<FileImportResult | null>(null);

// Decisión por personaje nuevo (clave: nombre en minúsculas).
type Choice = { action: 'create' } | { action: 'replace'; characterId: string | null };
const choices    = ref<Record<string, Choice>>({});
const searchText = ref<Record<string, string>>({});

const keyOf = (name: string) => name.trim().toLowerCase();
const className = (v: string | null) => classes.find(c => c.value === v)?.name ?? '';

function onFileChange(e: Event) {
  file.value    = (e.target as HTMLInputElement).files?.[0] ?? null;
  error.value   = '';
  preview.value = null;
  step.value    = 'select';
}

async function handlePreview() {
  if (!file.value) return;
  loading.value = true;
  error.value   = '';
  try {
    preview.value = await previewClanSync(props.clanId, file.value);
    choices.value = Object.fromEntries(preview.value.newCharacters.map(n => [keyOf(n.name), { action: 'create' } as Choice]));
    searchText.value = {};
    step.value = 'review';
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'No se pudo leer el archivo.';
  } finally {
    loading.value = false;
  }
}

/** Candidatos usados por otra decisión (no se puede reemplazar dos veces al mismo). */
const usedTargets = computed(() => new Set(
  Object.values(choices.value).filter((c): c is { action: 'replace'; characterId: string } => c.action === 'replace' && !!c.characterId).map(c => c.characterId),
));

/** Candidatos: personajes que hoy están en el clan pero no figuran en la planilla subida. */
function candidatesFor(name: string): SyncCandidate[] {
  const p = preview.value;
  if (!p) return [];
  const q = (searchText.value[keyOf(name)] ?? '').trim().toLowerCase();
  const own = choices.value[keyOf(name)];
  const ownId = own?.action === 'replace' ? own.characterId : null;
  return p.candidates.filter(c =>
    (!q || c.name.toLowerCase().includes(q)) && (!usedTargets.value.has(c._id) || c._id === ownId));
}

const ROLE_LABEL: Record<string, string> = { leader: 'Líder', officer: 'Oficial', member: '' };

function setAction(name: string, action: 'create' | 'replace') {
  choices.value[keyOf(name)] = action === 'create' ? { action: 'create' } : { action: 'replace', characterId: null };
}
function pickTarget(name: string, id: string) {
  choices.value[keyOf(name)] = { action: 'replace', characterId: id };
}
function targetName(name: string): string | null {
  const c = choices.value[keyOf(name)];
  if (c?.action !== 'replace' || !c.characterId) return null;
  return preview.value?.candidates.find(x => x._id === c.characterId)?.name ?? null;
}

/** Todos los "reemplazar" deben tener a quién. */
const canApply = computed(() => Object.values(choices.value).every(c => c.action === 'create' || !!c.characterId));

const hasWarnings = computed(() => {
  const w = preview.value?.warnings;
  return !!w && (w.invalidNames.length + w.unreadableDateColumns.length + w.duplicateNames.length + w.datesWithoutWar.length) > 0;
});

async function handleApply() {
  if (!file.value || !canApply.value) return;
  loading.value = true;
  error.value   = '';
  try {
    const resolutions: Record<string, ClanSyncResolution> = {};
    for (const [k, c] of Object.entries(choices.value)) {
      resolutions[k] = c.action === 'replace' && c.characterId ? { action: 'replace', characterId: c.characterId } : { action: 'create' };
    }
    result.value = await syncClanMembers(props.clanId, file.value, resolutions);
    step.value = 'done';
    await props.reload();
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Error al sincronizar.';
  } finally {
    loading.value = false;
  }
}

const STATUS_LABEL: Record<string, string> = {
  created: 'Creado', updated: 'Actualizado', replaced: 'Reemplazado', rejoined: 'Reingresó',
  transferred: 'Cambió de clan', skipped: 'Omitido',
};
const resultCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const r of result.value?.results ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
});
const highlightedResults = computed(() => (result.value?.results ?? []).filter(r => r.status !== 'updated'));
</script>

<template>
  <CustomModal title="Actualizar clan desde archivo" @close="emit('close')">
    <div class="modal-form">

      <!-- ── 1. Elegir archivo ── -->
      <template v-if="step === 'select'">
        <p class="modal-hint">
          El archivo reemplaza los <strong>miembros</strong> del clan. Antes de aplicar verás un resumen y podrás decidir qué
          hacer con cada personaje nuevo. Los que no aparezcan pasan a exmiembros (conservan su historial).<br />
          Columna obligatoria: <strong>Jugador</strong>. Opcionales: Resonancia, Armadura, Penetracion, Potencia, Resistencia, Clase, Whatsapp.
        </p>
        <div class="hint-attendance">
          <i class="fas fa-calendar-check hint-attendance__icon"></i>
          <p class="hint-attendance__text">
            Columnas de fecha (<em>28may</em>, <em>01Aug</em>, <em>3sept</em> o celdas de fecha) con valor <strong>1</strong> registran
            asistencia a la Guerra Sombría de ese día. Solo se agregan asistencias: nunca se borran las existentes.
          </p>
        </div>
        <div class="field-group">
          <label class="field-label">Archivo (.csv o .xlsx)</label>
          <input type="file" accept=".csv,.xlsx" class="sync-file-input" @change="onFileChange" :disabled="loading" />
        </div>
        <div class="step-actions">
          <button :disabled="loading || !file" @click="handlePreview">
            <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-magnifying-glass']"></i>
            {{ loading ? 'Revisando...' : 'Revisar archivo' }}
          </button>
        </div>
      </template>

      <!-- ── 2. Revisar ── -->
      <template v-else-if="step === 'review' && preview">
        <div class="sync-summary">
          <span class="sync-chip"><strong>{{ preview.summary.updated }}</strong> se actualizan</span>
          <span v-if="preview.summary.new" class="sync-chip sync-chip--new"><strong>{{ preview.summary.new }}</strong> nuevos</span>
          <span v-if="preview.summary.rejoin" class="sync-chip"><strong>{{ preview.summary.rejoin }}</strong> reingresan</span>
          <span v-if="preview.summary.transfer" class="sync-chip"><strong>{{ preview.summary.transfer }}</strong> vienen de otro clan</span>
          <span v-if="preview.summary.leaving" class="sync-chip sync-chip--out"><strong>{{ preview.summary.leaving }}</strong> pasan a exmiembros</span>
        </div>

        <!-- Avisos de lectura -->
        <div v-if="hasWarnings" class="sync-warnings">
          <p v-if="preview.warnings.invalidNames.length">
            <i class="fas fa-triangle-exclamation"></i>
            Filas omitidas por nombre inválido:
            <span v-for="n in preview.warnings.invalidNames" :key="n.row" class="sync-tag">fila {{ n.row }} ({{ n.value }})</span>
          </p>
          <p v-if="preview.warnings.duplicateNames.length">
            <i class="fas fa-triangle-exclamation"></i>
            Nombres repetidos (se usa la primera fila): {{ preview.warnings.duplicateNames.join(', ') }}
          </p>
          <p v-if="preview.warnings.unreadableDateColumns.length">
            <i class="fas fa-triangle-exclamation"></i>
            Columnas que parecen fecha pero no se entienden: {{ preview.warnings.unreadableDateColumns.join(', ') }}
          </p>
          <p v-if="preview.warnings.datesWithoutWar.length">
            <i class="fas fa-circle-info"></i>
            Sin Guerra Sombría registrada (esa asistencia no se carga): {{ preview.warnings.datesWithoutWar.join(', ') }}
          </p>
        </div>

        <p v-if="preview.transfers.some(t => t.blocked)" class="modal-hint">
          <i class="fas fa-ban"></i>
          Se omiten por ser líderes de otro clan: {{ preview.transfers.filter(t => t.blocked).map(t => `${t.name} (${t.fromClan})`).join(', ') }}
        </p>

        <!-- Personajes nuevos: crear o reemplazar -->
        <template v-if="preview.newCharacters.length">
          <p class="sync-section-title">Personajes nuevos</p>
          <p class="modal-hint">
            Si un nuevo es en realidad un miembro que cambió de nombre, elige <strong>Reemplazar</strong>: ese personaje toma el
            nombre y atributos nuevos y conserva su historial y asistencia.
          </p>
          <div v-for="n in preview.newCharacters" :key="n.name" class="sync-new">
            <div class="sync-new__head">
              <strong class="sync-new__name">{{ n.name }}</strong>
              <span class="sync-new__meta">{{ className((n.data.currentClass as string) ?? null) }}<template v-if="n.data.resonance"> · Res. {{ n.data.resonance }}</template></span>
            </div>
            <div class="sync-new__choice">
              <label><input type="radio" :name="`choice-${n.name}`" :checked="choices[keyOf(n.name)]?.action === 'create'" @change="setAction(n.name, 'create')" /> Crear como nuevo</label>
              <label><input type="radio" :name="`choice-${n.name}`" :checked="choices[keyOf(n.name)]?.action === 'replace'" @change="setAction(n.name, 'replace')" /> Reemplazar a…</label>
            </div>
            <div v-if="choices[keyOf(n.name)]?.action === 'replace'" class="sync-replace">
              <p v-if="targetName(n.name)" class="sync-replace__picked">
                <i class="fas fa-right-left"></i> <strong>{{ targetName(n.name) }}</strong> pasará a llamarse <strong>{{ n.name }}</strong>
              </p>
              <input v-model="searchText[keyOf(n.name)]" class="sync-replace__search" placeholder="Buscar por nombre..." />
              <div class="sync-replace__list">
                <span class="sync-replace__group">En el clan, pero no figuran en la planilla</span>
                <button
                  v-for="c in candidatesFor(n.name)" :key="c._id" type="button"
                  :class="['sync-replace__item', { 'is-selected': (choices[keyOf(n.name)] as any)?.characterId === c._id }]"
                  @click="pickTarget(n.name, c._id)"
                >
                  {{ c.name }}
                  <small v-if="ROLE_LABEL[c.role]">{{ ROLE_LABEL[c.role] }}</small>
                  <small v-if="c.currentClass">{{ className(c.currentClass) }}</small>
                </button>
                <span v-if="!candidatesFor(n.name).length" class="sync-replace__empty">
                  {{ preview.candidates.length ? 'Sin coincidencias.' : 'Todos los miembros actuales figuran en la planilla.' }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <div class="step-actions">
          <button class="btn-secondary" :disabled="loading" @click="step = 'select'">
            <i class="fas fa-arrow-left"></i> Volver
          </button>
          <button :disabled="loading || !canApply" @click="handleApply">
            <i :class="['fas', 'fa-rotate', { 'fa-spin': loading }]"></i>
            {{ loading ? 'Sincronizando...' : 'Sincronizar' }}
          </button>
        </div>
        <div v-if="loading" class="sync-progress-wrap">
          <div class="sync-progress-bar" />
          <span class="sync-progress-label">Procesando archivo, puede tomar unos segundos…</span>
        </div>
      </template>

      <!-- ── 3. Resultado ── -->
      <template v-else-if="step === 'done' && result">
        <div class="sync-summary">
          <span v-for="(n, status) in resultCounts" :key="status" class="sync-chip"><strong>{{ n }}</strong> {{ (STATUS_LABEL[status] ?? status).toLowerCase() }}</span>
          <span v-if="result.removed" class="sync-chip sync-chip--out"><strong>{{ result.removed }}</strong> pasados a exmiembros</span>
        </div>
        <ul v-if="highlightedResults.length" class="search-results">
          <li v-for="r in highlightedResults" :key="r.name" class="search-result-card" style="cursor:default">
            <div class="result-info">
              <div>
                <strong>{{ r.name }}</strong>
                <small>
                  {{ STATUS_LABEL[r.status] ?? r.status }}
                  <template v-if="r.previousName"> (antes {{ r.previousName }})</template>
                  <template v-if="r.reason"> — {{ r.reason }}</template>
                </small>
              </div>
            </div>
          </li>
        </ul>
        <div class="step-actions">
          <button @click="emit('close')"><i class="fas fa-check"></i> Listo</button>
        </div>
      </template>

      <p v-if="error" class="modal-error">{{ error }}</p>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./ClanMemberModals.scss" />
<style scoped lang="scss">
.sync-summary { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .75rem; }
.sync-chip {
  padding: .2rem .55rem;
  border-radius: 999px;
  font-size: .75rem;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .7);
  strong { color: rgba(255, 255, 255, .95); }
  &--new { border-color: rgba(227, 210, 168, .4); color: rgb(227, 210, 168); }
  &--out { border-color: rgba(229, 115, 115, .35); color: #e57373; }
}
.sync-warnings {
  display: flex; flex-direction: column; gap: .35rem;
  padding: .6rem .75rem; margin-bottom: .75rem;
  border-radius: 8px;
  background: rgba(255, 196, 0, .05);
  border: 1px solid rgba(255, 196, 0, .2);
  font-size: .78rem; color: rgba(255, 255, 255, .7);
  p { margin: 0; }
  i { color: #ffc400; margin-right: .3rem; }
}
.sync-tag { display: inline-block; margin: 0 .25rem; padding: 0 .35rem; border-radius: 4px; background: rgba(255, 255, 255, .06); }
.sync-section-title { margin: .25rem 0; font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: rgba(255, 255, 255, .6); }
.sync-new {
  padding: .6rem .75rem; margin-bottom: .5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .08);
  &__head { display: flex; align-items: baseline; gap: .5rem; }
  &__name { font-size: .9rem; }
  &__meta { font-size: .72rem; color: rgba(255, 255, 255, .45); }
  &__choice { display: flex; gap: 1rem; margin-top: .35rem; font-size: .8rem; label { display: flex; align-items: center; gap: .3rem; cursor: pointer; } }
}
.sync-replace {
  margin-top: .5rem;
  &__picked { margin: 0 0 .4rem; font-size: .78rem; color: rgb(227, 210, 168); }
  &__search {
    width: 100%; height: 30px; padding: 0 .6rem; box-sizing: border-box;
    background: rgba(255, 255, 255, .05); border: 1px solid rgba(255, 255, 255, .12); border-radius: 6px;
    color: rgba(255, 255, 255, .85); font-size: .8rem;
    &:focus { outline: none; border-color: rgba(227, 210, 168, .35); }
  }
  &__list { display: flex; flex-wrap: wrap; gap: .3rem; max-height: 150px; overflow-y: auto; margin-top: .4rem; }
  &__group { width: 100%; font-size: .68rem; text-transform: uppercase; letter-spacing: .05em; color: rgba(255, 255, 255, .4); margin-top: .2rem; }
  &__item {
    padding: .2rem .5rem; border-radius: 6px; font-size: .78rem; cursor: pointer;
    background: rgba(255, 255, 255, .04); border: 1px solid rgba(255, 255, 255, .1); color: rgba(255, 255, 255, .8);
    small { color: rgba(255, 255, 255, .4); margin-left: .2rem; }
    &:hover { border-color: rgba(227, 210, 168, .4); }
    &.is-selected { border-color: rgb(227, 210, 168); background: rgba(227, 210, 168, .1); color: rgb(227, 210, 168); }
  }
  &__empty { font-size: .75rem; color: rgba(255, 255, 255, .35); }
}
.btn-secondary { opacity: .8; }
</style>
