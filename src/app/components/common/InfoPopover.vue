<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * Ícono de información con un popover. Se abre al pasar el mouse o al enfocarlo con
 * teclado, y un clic lo deja fijo (útil en móvil). Se cierra con Escape o clic fuera.
 * El contenido va por el slot por defecto (o `text`).
 */
withDefaults(defineProps<{ text?: string; label?: string }>(), { label: 'Más información' });

const root   = ref<HTMLElement | null>(null);
const hover  = ref(false);
const pinned = ref(false);

function onDocumentClick(e: MouseEvent) {
  if (pinned.value && root.value && !root.value.contains(e.target as Node)) pinned.value = false;
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
});
</script>

<template>
  <span
    ref="root"
    class="info-popover"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <button
      type="button"
      class="info-popover-trigger"
      :aria-label="label"
      :aria-expanded="hover || pinned"
      @click.stop="pinned = !pinned"
      @focus="hover = true"
      @blur="hover = false"
    >
      <i class="fas fa-circle-info"></i>
    </button>
    <Transition name="info-popover-fade">
      <span v-if="hover || pinned" class="info-popover-panel" role="tooltip">
        <slot>{{ text }}</slot>
      </span>
    </Transition>
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
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: max-content;
  max-width: min(360px, 80vw);
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

  // Flecha
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    width: 10px;
    height: 10px;
    background: inherit;
    border-left: 1px solid rgba(227, 210, 168, .25);
    border-top: 1px solid rgba(227, 210, 168, .25);
    transform: translateX(-50%) rotate(45deg);
  }
}

.info-popover-fade-enter-active,
.info-popover-fade-leave-active { transition: opacity .12s ease, transform .12s ease; }
.info-popover-fade-enter-from,
.info-popover-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-4px); }
</style>
