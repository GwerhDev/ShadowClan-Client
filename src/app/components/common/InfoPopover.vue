<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

/**
 * Ícono de información con un popover. Se abre al pasar el mouse o al enfocarlo con
 * teclado, y un clic lo deja fijo (útil en móvil). Se cierra con Escape o clic fuera.
 * El contenido va por el slot por defecto (o `text`).
 *
 * El panel se renderiza en <body> con posición fija (ningún `overflow` de un contenedor lo
 * recorta), por encima de los modales, ajustado al viewport (se corre a los lados y se abre
 * hacia arriba si no cabe abajo) y se reposiciona al hacer scroll o redimensionar.
 */
withDefaults(defineProps<{ text?: string; label?: string }>(), { label: 'Más información' });

const VIEWPORT_MARGIN = 8;  // distancia mínima a los bordes de la pantalla
const GAP = 10;             // separación entre el ícono y el panel

const root    = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const panel   = ref<HTMLElement | null>(null);
const hover   = ref(false);
const pinned  = ref(false);
const visible = computed(() => hover.value || pinned.value);
const pos = reactive({ top: 0, left: 0, arrow: 0, placement: 'bottom' as 'bottom' | 'top' });

let closeTimer: ReturnType<typeof setTimeout> | null = null;

function enter() {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  hover.value = true;
}
/** Cierre con una pequeña demora para poder pasar el mouse del ícono al panel. */
function leave() {
  closeTimer = setTimeout(() => { hover.value = false; closeTimer = null; }, 120);
}

function place() {
  if (!trigger.value || !panel.value) return;
  const r = trigger.value.getBoundingClientRect();
  const w = panel.value.offsetWidth;
  const h = panel.value.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const center = r.left + r.width / 2;

  pos.left = Math.min(Math.max(center - w / 2, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vw - w - VIEWPORT_MARGIN));
  const fitsBelow = r.bottom + GAP + h <= vh - VIEWPORT_MARGIN;
  const fitsAbove = r.top - GAP - h >= VIEWPORT_MARGIN;
  pos.placement = !fitsBelow && fitsAbove ? 'top' : 'bottom';
  pos.top = pos.placement === 'top' ? r.top - GAP - h : r.bottom + GAP;
  pos.arrow = Math.min(Math.max(center - pos.left, 12), w - 12);
}

function onReposition() { if (visible.value) place(); }

watch(visible, async v => {
  if (v) {
    await nextTick();
    place();
    window.addEventListener('scroll', onReposition, { capture: true, passive: true });
    window.addEventListener('resize', onReposition);
  } else {
    window.removeEventListener('scroll', onReposition, { capture: true });
    window.removeEventListener('resize', onReposition);
  }
});

function onDocumentClick(e: MouseEvent) {
  const t = e.target as Node;
  if (pinned.value && !root.value?.contains(t) && !panel.value?.contains(t)) pinned.value = false;
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { pinned.value = false; hover.value = false; }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', onReposition, { capture: true });
  window.removeEventListener('resize', onReposition);
  if (closeTimer) clearTimeout(closeTimer);
});
</script>

<template>
  <span
    ref="root"
    class="info-popover"
    @mouseenter="enter"
    @mouseleave="leave"
  >
    <button
      ref="trigger"
      type="button"
      class="info-popover-trigger"
      :aria-label="label"
      :aria-expanded="visible"
      @click.stop="pinned = !pinned"
      @focus="enter"
      @blur="leave"
    >
      <i class="fas fa-circle-info"></i>
    </button>
    <Teleport to="body">
      <Transition name="info-popover-fade">
        <span
          v-if="visible"
          ref="panel"
          :class="['info-popover-panel', `is-${pos.placement}`]"
          :style="{ top: `${pos.top}px`, left: `${pos.left}px`, '--arrow-left': `${pos.arrow}px` }"
          role="tooltip"
          @mouseenter="enter"
          @mouseleave="leave"
        >
          <slot>{{ text }}</slot>
        </span>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped lang="scss">
.info-popover {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info-popover-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(227, 210, 168, .6);
  font-size: 1rem;
  cursor: pointer;
  transition: color .15s, background .15s;

  &:hover,
  &:focus-visible,
  &[aria-expanded="true"] {
    color: rgb(227, 210, 168);
    background: rgba(227, 210, 168, .08);
  }

  &:focus-visible { outline: 1px solid rgba(227, 210, 168, .5); }
}

.info-popover-panel {
  position: fixed;
  // Por encima de los modales (z-index 9999).
  z-index: 10000;
  display: block;
  width: max-content;
  max-width: min(360px, calc(100vw - 16px));
  padding: .75rem .9rem;
  background: var(--color-primary-bg, #16181f);
  border: 1px solid rgba(227, 210, 168, .25);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
  color: rgba(255, 255, 255, .75);
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-size: .8rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: normal;
  text-align: left;
  text-transform: none;
  white-space: normal;

  // Flecha apuntando al ícono (se mueve si el panel se corre para caber en pantalla).
  &::before {
    content: '';
    position: absolute;
    left: var(--arrow-left, 50%);
    width: 10px;
    height: 10px;
    background: inherit;
    transform: translateX(-50%) rotate(45deg);
  }

  &.is-bottom::before {
    top: -6px;
    border-left: 1px solid rgba(227, 210, 168, .25);
    border-top: 1px solid rgba(227, 210, 168, .25);
  }

  &.is-top::before {
    bottom: -6px;
    border-right: 1px solid rgba(227, 210, 168, .25);
    border-bottom: 1px solid rgba(227, 210, 168, .25);
  }
}

.info-popover-fade-enter-active,
.info-popover-fade-leave-active { transition: opacity .12s ease; }
.info-popover-fade-enter-from,
.info-popover-fade-leave-to { opacity: 0; }
</style>
