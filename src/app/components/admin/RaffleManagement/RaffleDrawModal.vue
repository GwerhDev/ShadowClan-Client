<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { RaffleDrawResult } from '../../../../interfaces';

// Animación del sorteo, premio por premio: un carrete de nombres gira y desacelera hasta
// detenerse en el ganador de cada premio; quien gana sale del carrete para los siguientes.
// Los ganadores los decide la API en una sola petición (el orden del carrete es solo visual).

type Person = { _id: string; name: string };

const props = defineProps<{
  participants: Person[];
  prizeNames: string[];
  draw: () => Promise<RaffleDrawResult>;
}>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'drawn', result: RaffleDrawResult): void }>();

const ROW_H = 48;           // alto de una fila del carrete (px)
const SPEED = 18;           // filas por segundo mientras gira libre
const MIN_SPIN_MS = 2200;   // giro mínimo antes de empezar a frenar
const STOP_MS = 3600;       // duración del frenado
const MIN_STOP_ROWS = 22;   // filas que recorre como mínimo al frenar

const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

const result   = ref<RaffleDrawResult | null>(null);
const error    = ref('');
const round    = ref(0);                         // premio en curso
const revealed = ref(0);                         // premios ya revelados
const phase    = ref<'spinning' | 'revealed' | 'finished' | 'error'>('spinning');
const reel     = ref<Person[]>(shuffle(props.participants));
const offset   = ref(0);                         // posición del carrete en filas

let frame = 0;
let start = 0;
let last = 0;
let stop: { from: number; to: number; t0: number } | null = null;

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

function spin() {
  start = 0;
  stop = null;
  phase.value = 'spinning';
  frame = requestAnimationFrame(tick);
}

function tick(now: number) {
  if (!start) { start = now; last = now; }
  if (stop) {
    const p = Math.min(1, (now - stop.t0) / STOP_MS);
    offset.value = stop.from + (stop.to - stop.from) * easeOutCubic(p);
    if (p >= 1) { reveal(); return; }
  } else {
    offset.value += ((now - last) / 1000) * SPEED;
    if (result.value && now - start >= MIN_SPIN_MS) beginStop(now);
  }
  last = now;
  frame = requestAnimationFrame(tick);
}

function beginStop(now: number) {
  const n = reel.value.length;
  const winnerId = result.value!.draws[round.value].winner.character;
  const winnerIdx = Math.max(0, reel.value.findIndex(p => p._id === winnerId));
  const base = Math.ceil(offset.value) + MIN_STOP_ROWS;
  stop = { from: offset.value, to: base + ((winnerIdx - (base % n)) + n) % n, t0: now };
}

function reveal() {
  revealed.value = round.value + 1;
  phase.value = revealed.value >= props.prizeNames.length ? 'finished' : 'revealed';
}

/** Siguiente premio: los ganadores anteriores salen del carrete. */
function nextPrize() {
  const won = new Set(result.value!.draws.slice(0, revealed.value).map(d => d.winner.character));
  round.value = revealed.value;
  reel.value = shuffle(props.participants.filter(p => !won.has(p._id)));
  offset.value = 0;
  spin();
}

/** Filas visibles alrededor de la central, desplazadas por la fracción. */
const rows = computed(() => {
  const n = reel.value.length;
  const center = Math.floor(offset.value);
  const frac = offset.value - center;
  return [-2, -1, 0, 1, 2, 3].map(d => {
    const i = center + d;
    return { key: i, name: n ? reel.value[((i % n) + n) % n].name : '', y: (d - frac) * ROW_H };
  });
});

const current = computed(() => result.value?.draws[round.value] ?? null);
const showWinner = computed(() => phase.value === 'revealed' || phase.value === 'finished');

onMounted(async () => {
  spin();
  try {
    result.value = await props.draw();
    emit('drawn', result.value);
  } catch (e: any) {
    cancelAnimationFrame(frame);
    error.value = e?.response?.data?.message ?? 'No se pudo realizar el sorteo.';
    phase.value = 'error';
  }
});

onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <Teleport to="body">
    <div class="draw-overlay" @click.self="phase === 'finished' || phase === 'error' ? emit('close') : null">
      <div class="draw-modal" :class="`is-${phase}`">
        <p class="draw-kicker">
          Sorteo<template v-if="prizeNames.length > 1"> · premio {{ round + 1 }} de {{ prizeNames.length }}</template>
        </p>
        <h2 class="draw-prize">{{ prizeNames[round] }}</h2>

        <template v-if="phase !== 'error'">
          <div class="reel" :style="{ height: `${ROW_H * 3}px` }">
            <div class="reel-highlight" :style="{ top: `${ROW_H}px`, height: `${ROW_H}px` }"></div>
            <div
              v-for="r in rows" :key="r.key"
              class="reel-row"
              :class="{ winner: showWinner && Math.abs(r.y) < 1 }"
              :style="{ height: `${ROW_H}px`, transform: `translateY(${r.y + ROW_H}px)` }"
            >{{ r.name }}</div>
          </div>

          <p v-if="phase === 'spinning'" class="draw-status">
            <i class="fas fa-dice"></i> Sorteando entre {{ reel.length }} participante{{ reel.length === 1 ? '' : 's' }}…
          </p>

          <div v-else :key="round" class="draw-result">
            <div class="draw-sparks" aria-hidden="true">
              <span v-for="i in 16" :key="i" :style="{ '--i': i }"></span>
            </div>
            <p class="draw-winner"><i class="fas fa-trophy"></i> {{ current?.winner.name }}</p>
            <p class="draw-note" v-if="current?.winnerHasUser">Se le notificó para que se contacte con los líderes y cobre su premio.</p>
            <p class="draw-note" v-else>No tiene una cuenta vinculada: avísale tú para que cobre su premio.</p>

            <button v-if="phase === 'revealed'" class="draw-btn" @click="nextPrize">
              Siguiente premio: {{ prizeNames[revealed] }} <i class="fas fa-arrow-right"></i>
            </button>
          </div>

          <!-- Resumen de los premios ya revelados -->
          <ol v-if="prizeNames.length > 1 && revealed" class="draw-summary">
            <li v-for="(d, i) in result!.draws.slice(0, revealed)" :key="i">
              <span class="draw-summary__prize">{{ d.prizeName }}</span>
              <span class="draw-summary__winner">{{ d.winner.name }}</span>
            </li>
          </ol>

          <button v-if="phase === 'finished'" class="draw-btn" @click="emit('close')">Cerrar</button>
        </template>

        <div v-else class="draw-result">
          <p class="draw-error"><i class="fas fa-triangle-exclamation"></i> {{ error }}</p>
          <button class="draw-btn" @click="emit('close')">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);

.draw-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .72);
  backdrop-filter: blur(4px);
}

.draw-modal {
  position: relative;
  width: min(420px, 92vw);
  max-height: 92dvh;
  overflow-y: auto;
  padding: 2rem 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .75rem;
  text-align: center;
  background: #121212;
  border: 1px solid rgba(227, 210, 168, .2);
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(0, 0, 0, .6);
  transition: box-shadow .4s;

  &.is-revealed,
  &.is-finished { box-shadow: 0 0 70px rgba(227, 210, 168, .18), 0 0 40px rgba(0, 0, 0, .6); }
}

.draw-kicker {
  margin: 0;
  font-size: .7rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .4);
}

.draw-prize {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: clamp(1.05rem, .95rem + .45vw, 1.3rem);
  color: $gold;
}

.reel {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  margin-top: .5rem;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .07);
  // Desvanece arriba y abajo.
  mask-image: linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent);
}

.reel-highlight {
  position: absolute;
  left: .5rem;
  right: .5rem;
  border-radius: 8px;
  border: 1px solid rgba(227, 210, 168, .45);
  background: rgba(227, 210, 168, .08);
}

.reel-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(255, 255, 255, .8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  will-change: transform;

  &.winner {
    color: $gold;
    font-size: 1.2rem;
    text-shadow: 0 0 12px rgba(227, 210, 168, .6);
  }
}

.draw-status {
  margin: .25rem 0 0;
  font-size: .82rem;
  color: rgba(255, 255, 255, .5);

  i { margin-right: .3rem; animation: shake .5s ease-in-out infinite; }
}

.draw-result {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6rem;
  animation: fade-up .4s ease-out;
}

.draw-winner {
  margin: .25rem 0 0;
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: $gold;

  i { margin-right: .35rem; }
}

.draw-note {
  margin: 0;
  font-size: .82rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, .6);
}

.draw-error {
  margin: .5rem 0;
  font-size: .88rem;
  color: #f87171;
}

.draw-btn {
  margin-top: .35rem;
  padding: .5rem 1.4rem;
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  border-radius: 8px;
  font-size: .85rem;
  background: rgba(227, 210, 168, .12);
  border: 1px solid rgba(227, 210, 168, .45);
  color: $gold;
  cursor: pointer;

  &:hover { background: rgba(227, 210, 168, .2); }
}

.draw-summary {
  width: 100%;
  margin: .25rem 0 0;
  padding: 0;
  list-style: none;
  counter-reset: prize;
  display: flex;
  flex-direction: column;
  gap: .3rem;

  li {
    counter-increment: prize;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    padding: .4rem .7rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, .03);
    border: 1px solid rgba(255, 255, 255, .06);
    font-size: .8rem;

    &::before {
      content: counter(prize) '.';
      color: rgba(255, 255, 255, .35);
    }
  }

  &__prize {
    flex: 1;
    text-align: left;
    color: rgba(255, 255, 255, .6);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__winner {
    font-weight: 600;
    color: $gold;
  }
}

.draw-sparks {
  position: absolute;
  left: 50%;
  top: 0;
  pointer-events: none;

  span {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $gold;
    opacity: 0;
    // 16 destellos en círculo.
    --angle: calc(var(--i) * 22.5deg);
    animation: burst .9s ease-out forwards;

    &:nth-child(3n) { background: #e57373; }
    &:nth-child(4n) { background: #69a9e4; }
  }
}

@keyframes burst {
  0%   { transform: rotate(var(--angle)) translateX(0); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateX(120px); opacity: 0; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}
</style>
