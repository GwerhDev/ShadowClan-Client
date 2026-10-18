<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { vStickyBar } from '../../../directives/stickyBar';
import RaffleDrawModal from './RaffleDrawModal.vue';
import CustomModal from '../../Modals/CustomModal.vue';
import InfoPopover from '../../common/InfoPopover.vue';
import { getRafflePrizes, getRaffleEligibility, drawRaffle, getRaffles, deleteRaffle } from '../../../../middlewares/services/raffleService';
import { getAttendanceCycles } from '../../../../middlewares/services';
import { activeCharacterId } from '../../../../middlewares/services/activeCharacter';
import type {
  AttendanceCycle, RaffleActivity, RaffleCriteria, RaffleEligibility, RaffleHistoryItem, RafflePrize, RaffleRange,
} from '../../../../interfaces';

// Sorteos del clan: premios en orden (catálogo del Dashboard), período y requisitos de
// asistencia por actividad → lista de elegibles (ajustable a mano) → sorteo. Los ganadores los
// elige la API premio por premio; quien gana sale del bombo para los siguientes.

const RANGES: Array<{ value: RaffleRange; label: string }> = [
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
  { value: 'cycle', label: 'Ciclo' },
];
const ACTIVITIES: Array<{ value: RaffleActivity; label: string; short: string }> = [
  { value: 'shadow_war', label: 'Guerra Sombría', short: 'Guerra' },
  { value: 'vigil_of_blades', label: 'Vigilia de Espadas', short: 'Vigilia' },
];
const ROLE_LABEL: Record<string, string> = { leader: 'Líder', officer: 'Oficial', member: '' };

// ── Configuración ────────────────────────────────────────────────────────────
const prizes       = ref<RafflePrize[]>([]);
const prizePick    = ref('');               // premio elegido en el selector
const prizeQueue   = ref<string[]>([]);     // premios del sorteo, en orden (puede repetirse)
const includeStaff = ref(false);            // líder y oficiales elegibles (por defecto no)
const range        = ref<RaffleRange>('30');
const cycles   = ref<AttendanceCycle[]>([]);
const cycleId  = ref('');
const rules = reactive<Record<RaffleActivity, { enabled: boolean; mode: 'count' | 'percent'; min: number }>>({
  shadow_war:      { enabled: true,  mode: 'count', min: 1 },
  vigil_of_blades: { enabled: false, mode: 'count', min: 1 },
});

const criteria = computed<RaffleCriteria>(() => ({
  range: range.value,
  cycleId: range.value === 'cycle' ? cycleId.value || undefined : undefined,
  rules: ACTIVITIES
    .filter(a => rules[a.value].enabled)
    .map(a => ({ activity: a.value, mode: rules[a.value].mode, min: Math.max(0, Math.round(Number(rules[a.value].min) || 0)) })),
  includeStaff: includeStaff.value,
}));
const criteriaKey = computed(() => JSON.stringify(criteria.value));
const prizeById   = computed(() => new Map(prizes.value.map(p => [p._id, p])));
const prizePicked = computed(() => prizeById.value.get(prizePick.value) ?? null);
const queueNames  = computed(() => prizeQueue.value.map(id => prizeById.value.get(id)?.name ?? '—'));
const queuePrizes = computed(() => prizeQueue.value.map(id => prizeById.value.get(id) ?? null));

function addPrize() {
  if (prizePick.value) prizeQueue.value = [...prizeQueue.value, prizePick.value];
}
function movePrize(i: number, dir: -1 | 1) {
  const q = [...prizeQueue.value];
  const j = i + dir;
  if (j < 0 || j >= q.length) return;
  [q[i], q[j]] = [q[j], q[i]];
  prizeQueue.value = q;
}
function removePrize(i: number) {
  prizeQueue.value = prizeQueue.value.filter((_, k) => k !== i);
}

// ── Participantes ────────────────────────────────────────────────────────────
const eligibility  = ref<RaffleEligibility | null>(null);
const computedKey  = ref('');
const selected     = ref<Set<string>>(new Set());
const search       = ref('');
const calculating  = ref(false);
const calcError    = ref('');
const showParticipants = ref(false);

/** Los requisitos cambiaron desde el último cálculo: hay que recalcular antes de sortear. */
const stale = computed(() => !!eligibility.value && computedKey.value !== criteriaKey.value);
const eligibleCount = computed(() => eligibility.value?.members.filter(m => m.eligible).length ?? 0);
const visibleMembers = computed(() => {
  const q = search.value.trim().toLowerCase();
  return (eligibility.value?.members ?? []).filter(m => !q || m.name.toLowerCase().includes(q));
});

/** Abre la lista de participantes. Si hay un recálculo pendiente lo hace ya; si no, abre la
 *  lista actual (conserva la selección manual al cerrar y volver a abrir). */
async function openParticipants() {
  if (!eligibility.value || stale.value) await calculate();
  if (eligibility.value && !stale.value) showParticipants.value = true;
}

// Recalcular automáticamente 1 s después del último cambio en los requisitos/período.
let recalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(criteriaKey, () => {
  if (recalcTimer) clearTimeout(recalcTimer);
  recalcTimer = setTimeout(() => { recalcTimer = null; calculate(); }, 1000);
});
onBeforeUnmount(() => { if (recalcTimer) clearTimeout(recalcTimer); });

async function calculate() {
  if (recalcTimer) { clearTimeout(recalcTimer); recalcTimer = null; }
  if (range.value === 'cycle' && !cycleId.value) { calcError.value = 'Selecciona un ciclo.'; return; }
  const key = criteriaKey.value;
  calculating.value = true;
  calcError.value = '';
  try {
    const data = await getRaffleEligibility(criteria.value);
    // Si los requisitos cambiaron mientras se calculaba, este resultado ya no sirve.
    if (key !== criteriaKey.value) return;
    eligibility.value = data;
    computedKey.value = key;
    selected.value = new Set(data.members.filter(m => m.eligible).map(m => m._id));
  } catch (e: any) {
    calcError.value = e?.response?.data?.message ?? 'No se pudo calcular la lista de participantes.';
  } finally { calculating.value = false; }
}

function toggle(id: string) {
  const s = new Set(selected.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selected.value = s;
}
function selectWhere(pred: (m: RaffleEligibility['members'][number]) => boolean) {
  selected.value = new Set((eligibility.value?.members ?? []).filter(pred).map(m => m._id));
}

// ── Sorteo ───────────────────────────────────────────────────────────────────
const drawing = ref(false);
/** Un premio por persona: hacen falta al menos tantos participantes como premios. */
const notEnough = computed(() => selected.value.size > 0 && selected.value.size < prizeQueue.value.length);
const canDraw = computed(() =>
  prizeQueue.value.length > 0 && selected.value.size >= prizeQueue.value.length && !!eligibility.value && !stale.value);
const drawParticipants = computed(() =>
  (eligibility.value?.members ?? []).filter(m => selected.value.has(m._id)).map(m => ({ _id: m._id, name: m.name })));

const doDraw = () => drawRaffle(prizeQueue.value, [...selected.value], criteria.value);

// ── Historial ────────────────────────────────────────────────────────────────
const history        = ref<RaffleHistoryItem[]>([]);
const historyPage    = ref(1);
const historyPages   = ref(1);
const historyLoading = ref(false);

async function loadHistory(reset = false) {
  if (historyLoading.value) return;
  historyLoading.value = true;
  try {
    const page = reset ? 1 : historyPage.value + 1;
    const res = await getRaffles(page);
    history.value = reset ? res.data : [...history.value, ...res.data];
    historyPage.value = page;
    historyPages.value = Number(res.pages) || 1;
  } finally { historyLoading.value = false; }
}

// Eliminar un sorteo (con confirmación).
const toDelete    = ref<RaffleHistoryItem | null>(null);
const deleting    = ref(false);
const deleteError = ref('');

function askDelete(h: RaffleHistoryItem) {
  toDelete.value = h;
  deleteError.value = '';
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  deleteError.value = '';
  try {
    await deleteRaffle(toDelete.value._id);
    toDelete.value = null;
    await loadHistory(true);
  } catch (e: any) {
    deleteError.value = e?.response?.data?.message ?? 'No se pudo eliminar el sorteo.';
  } finally { deleting.value = false; }
}

// ── Formato ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
const cycleLabel = (c: AttendanceCycle) =>
  `${fmtDate(c.startDate)} – ${c.endDate ? fmtDate(c.endDate) : 'en curso'} · ${c.activityType === 'shadow' ? 'Sombra' : 'Inmortal'}`;
const ruleLabel = (r: { activity: RaffleActivity; mode: 'count' | 'percent'; min: number }) =>
  `${ACTIVITIES.find(a => a.value === r.activity)?.short} ≥ ${r.min}${r.mode === 'percent' ? '%' : ''}`;
const periodLabel = (h: RaffleHistoryItem) =>
  h.criteria.range === 'cycle' ? `Ciclo ${fmtDate(h.criteria.since)} – ${fmtDate(h.criteria.until)}` : `${h.criteria.range} días`;

watch(range, r => { if (r === 'cycle' && !cycleId.value && cycles.value[0]) cycleId.value = cycles.value[0]._id; });

onMounted(async () => {
  const [p, c] = await Promise.allSettled([getRafflePrizes(), getAttendanceCycles(1, activeCharacterId())]);
  if (p.status === 'fulfilled') { prizes.value = p.value; prizePick.value = p.value[0]?._id ?? ''; }
  if (c.status === 'fulfilled') cycles.value = c.value.data;
  calculate();
  loadHistory(true);
});
</script>

<template>
  <div class="raffle-page">
    <!-- 1. Configuración -->
    <section class="raffle-card">
      <h3 class="raffle-card__title"><i class="fas fa-sliders"></i> Configuración</h3>

      <div class="field">
        <label for="raffle-prize">Premios</label>
        <template v-if="prizes.length">
          <div class="prize-picker">
            <select id="raffle-prize" v-model="prizePick" class="input">
              <option v-for="p in prizes" :key="p._id" :value="p._id">{{ p.name }}</option>
            </select>
            <button type="button" class="btn btn--secondary" :disabled="!prizePick" @click="addPrize">
              <i class="fas fa-plus"></i> Agregar
            </button>
            <InfoPopover v-if="prizePicked?.description" :text="prizePicked.description" :label="`Descripción de ${prizePicked.name}`" />
          </div>

          <ol v-if="prizeQueue.length" class="prize-queue">
            <li v-for="(name, i) in queueNames" :key="i">
              <span class="prize-queue__pos">{{ i + 1 }}</span>
              <span class="prize-queue__name">{{ name }}</span>
              <div class="prize-queue__actions">
                <InfoPopover v-if="queuePrizes[i]?.description" :text="queuePrizes[i]!.description!" :label="`Descripción de ${name}`" />
                <button type="button" class="icon-btn" :disabled="i === 0" title="Subir" @click="movePrize(i, -1)"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="icon-btn" :disabled="i === prizeQueue.length - 1" title="Bajar" @click="movePrize(i, 1)"><i class="fas fa-chevron-down"></i></button>
                <button type="button" class="icon-btn icon-btn--danger" title="Quitar" @click="removePrize(i)"><i class="fas fa-xmark"></i></button>
              </div>
            </li>
          </ol>
          <p class="hint">
            Se sortean en este orden; quien gana un premio queda fuera de los siguientes.
            Puedes agregar el mismo premio varias veces si hay más de una unidad.
          </p>
        </template>
        <p v-else class="hint">No hay premios disponibles. Pide a un administrador que los agregue.</p>
      </div>

      <div class="field">
        <label>Período de asistencia</label>
        <div class="chips">
          <button
            v-for="r in RANGES" :key="r.value" type="button"
            :class="['chip', { active: range === r.value }]"
            :disabled="r.value === 'cycle' && !cycles.length"
            :title="r.value === 'cycle' && !cycles.length ? 'El clan no tiene ciclos definidos' : ''"
            @click="range = r.value"
          >{{ r.label }}</button>
        </div>
        <select v-if="range === 'cycle'" v-model="cycleId" class="input">
          <option v-for="c in cycles" :key="c._id" :value="c._id">{{ cycleLabel(c) }}</option>
        </select>
      </div>

      <div class="field">
        <label>Requisitos de asistencia</label>
        <div v-for="a in ACTIVITIES" :key="a.value" :class="['rule', { off: !rules[a.value].enabled }]">
          <label class="rule__toggle">
            <input type="checkbox" v-model="rules[a.value].enabled" />
            <span>{{ a.label }}</span>
          </label>
          <div class="rule__controls">
            <div class="segmented">
              <button type="button" :class="{ active: rules[a.value].mode === 'count' }" :disabled="!rules[a.value].enabled"
                @click="rules[a.value].mode = 'count'">Cantidad</button>
              <button type="button" :class="{ active: rules[a.value].mode === 'percent' }" :disabled="!rules[a.value].enabled"
                @click="rules[a.value].mode = 'percent'">%</button>
            </div>
            <span class="rule__min">
              mín.
              <input
                type="number" min="0" :max="rules[a.value].mode === 'percent' ? 100 : 1000"
                v-model.number="rules[a.value].min" :disabled="!rules[a.value].enabled" class="input input--num"
              />
              {{ rules[a.value].mode === 'percent' ? '%' : 'asist.' }}
            </span>
          </div>
        </div>
        <p class="hint">Sin requisitos activos, todos los miembros actuales son elegibles.</p>
      </div>

      <div class="field">
        <label>Participantes</label>
        <label class="rule__toggle">
          <input type="checkbox" v-model="includeStaff" />
          <span>Incluir líder y oficiales</span>
        </label>
        <p class="hint">Si no los incluyes, igual puedes marcarlos a mano en la lista.</p>
      </div>

      <div class="actions">
        <p v-if="calcError" class="error">{{ calcError }}</p>
        <button class="btn btn--secondary" :disabled="calculating" @click="openParticipants">
          <i :class="calculating ? 'fas fa-spinner fa-spin' : 'fas fa-users-viewfinder'"></i>
          {{ calculating ? 'Calculando participantes…' : `Ver participantes (${selected.size})` }}
        </button>
      </div>

      <div class="draw-bar">
        <span class="hint">
          <template v-if="!prizeQueue.length">Agrega al menos un premio.</template>
          <template v-else-if="!eligibility || stale">Calculando participantes…</template>
          <template v-else-if="!selected.size">Selecciona al menos un participante.</template>
          <span v-else-if="notEnough" class="error">
            Hay {{ selected.size }} participante{{ selected.size === 1 ? '' : 's' }} para {{ prizeQueue.length }} premios:
            cada persona puede ganar uno solo.
          </span>
          <template v-else>
            {{ prizeQueue.length }} premio{{ prizeQueue.length === 1 ? '' : 's' }} ·
            {{ selected.size }} participante{{ selected.size === 1 ? '' : 's' }}
          </template>
        </span>
        <button class="btn btn--primary btn--draw" :disabled="!canDraw" @click="drawing = true">
          <i class="fas fa-dice"></i>
          {{ prizeQueue.length === 1 ? `Sortear «${queueNames[0]}»` : `Sortear ${prizeQueue.length || ''} premios` }}
        </button>
      </div>
    </section>

    <!-- 2. Participantes (modal) -->
    <CustomModal v-if="showParticipants && eligibility" title="Participantes" @close="showParticipants = false">
      <div class="participants-modal">
      <p class="hint">
        {{ eligibleCount }} de {{ eligibility.members.length }} miembros cumplen los requisitos ·
        {{ eligibility.totals.shadow_war }} Guerra(s) y {{ eligibility.totals.vigil_of_blades }} Vigilia(s) en el período
        ({{ fmtDate(eligibility.period.since) }} – {{ fmtDate(eligibility.period.until) }}).
      </p>

      <div class="participants-bar" v-sticky-bar>
        <div class="search-wrap">
          <i class="fas fa-magnifying-glass search-icon"></i>
          <input v-model="search" class="input search-input" placeholder="Buscar miembro..." />
        </div>
        <div class="bulk">
          <button class="link-btn" @click="selectWhere(m => m.eligible)">Solo elegibles</button>
          <button class="link-btn" @click="selectWhere(() => true)">Todos</button>
          <button class="link-btn" @click="selectWhere(() => false)">Ninguno</button>
        </div>
      </div>

      <ul class="members">
        <li
          v-for="m in visibleMembers" :key="m._id"
          :class="['member', { selected: selected.has(m._id), ineligible: !m.eligible }]"
          @click="toggle(m._id)"
        >
          <input type="checkbox" :checked="selected.has(m._id)" @click.stop="toggle(m._id)" />
          <div class="member__info">
            <span class="member__name">
              {{ m.name }}
              <small v-if="ROLE_LABEL[m.role]" class="badge">{{ ROLE_LABEL[m.role] }}</small>
            </span>
            <span class="member__stats">
              <span v-for="a in ACTIVITIES" :key="a.value">
                {{ a.short }} {{ m.stats[a.value].attended }}/{{ m.stats[a.value].total }} ({{ m.stats[a.value].percentage }}%)
              </span>
            </span>
          </div>
          <span v-if="m.eligible" class="member__flag ok" title="Cumple los requisitos"><i class="fas fa-check"></i></span>
          <span v-else-if="!m.meetsAttendance" class="member__flag no" title="No cumple los requisitos de asistencia"><i class="fas fa-xmark"></i></span>
          <span v-else class="member__flag staff" title="Líder/oficial: excluido por la configuración (puedes marcarlo a mano)"><i class="fas fa-shield-halved"></i></span>
        </li>
        <li v-if="!visibleMembers.length" class="empty">Sin coincidencias.</li>
      </ul>

      <div class="modal-footer">
        <span class="hint">
          {{ selected.size }} participante{{ selected.size === 1 ? '' : 's' }} seleccionado{{ selected.size === 1 ? '' : 's' }}
        </span>
        <button class="btn btn--secondary" @click="showParticipants = false">Listo</button>
      </div>
      </div>
    </CustomModal>

    <!-- 3. Historial -->
    <section class="raffle-card">
      <h3 class="raffle-card__title"><i class="fas fa-clock-rotate-left"></i> Historial</h3>
      <ul v-if="history.length" class="history">
        <li v-for="h in history" :key="h._id" class="history__item">
          <button class="icon-btn icon-btn--danger history__delete" title="Eliminar sorteo" @click="askDelete(h)">
            <i class="fas fa-trash"></i>
          </button>
          <ol class="history__draws">
            <li v-for="(d, i) in h.draws" :key="i" class="history__main">
              <span class="history__prize">{{ d.prizeName }}</span>
              <span class="history__winner"><i class="fas fa-trophy"></i> {{ d.winner.name }}</span>
            </li>
          </ol>
          <div class="history__meta">
            <span>{{ fmtDate(h.createdAt) }}</span>
            <span>{{ h.participantsCount }} participante{{ h.participantsCount === 1 ? '' : 's' }}</span>
            <span>{{ periodLabel(h) }}</span>
            <span v-if="h.criteria.rules.length">{{ h.criteria.rules.map(ruleLabel).join(' · ') }}</span>
            <span v-if="h.criteria.includeStaff">con líder y oficiales</span>
            <span v-if="h.drawnByCharacter">por {{ h.drawnByCharacter.name }}</span>
          </div>
        </li>
      </ul>
      <p v-else-if="!historyLoading" class="hint">Aún no hay sorteos en este clan.</p>
      <button v-if="historyPage < historyPages" class="link-btn more" :disabled="historyLoading" @click="loadHistory()">
        {{ historyLoading ? 'Cargando…' : 'Ver más' }}
      </button>
    </section>

    <!-- Confirmar eliminación de un sorteo -->
    <CustomModal v-if="toDelete" title="Eliminar sorteo" @close="!deleting && (toDelete = null)">
      <div class="confirm-modal">
        <p>
          ¿Eliminar el sorteo del <b>{{ fmtDate(toDelete.createdAt) }}</b>?
          Se borrará del historial y los ganadores que aún no vieron el aviso ya no lo recibirán.
        </p>
        <ol class="history__draws">
          <li v-for="(d, i) in toDelete.draws" :key="i" class="history__main">
            <span class="history__prize">{{ d.prizeName }}</span>
            <span class="history__winner"><i class="fas fa-trophy"></i> {{ d.winner.name }}</span>
          </li>
        </ol>
        <p class="hint">Esta acción no se puede deshacer.</p>
        <p v-if="deleteError" class="error">{{ deleteError }}</p>
        <div class="confirm-modal__actions">
          <button class="btn btn--secondary" :disabled="deleting" @click="toDelete = null">Cancelar</button>
          <button class="btn btn--danger" :disabled="deleting" @click="confirmDelete">
            <i :class="deleting ? 'fas fa-spinner fa-spin' : 'fas fa-trash'"></i> Eliminar
          </button>
        </div>
      </div>
    </CustomModal>

    <RaffleDrawModal
      v-if="drawing"
      :participants="drawParticipants"
      :prize-names="queueNames"
      :draw="doDraw"
      @drawn="loadHistory(true)"
      @close="drawing = false"
    />
  </div>
</template>

<style scoped lang="scss" src="./RaffleManagement.scss" />
